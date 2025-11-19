from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F # <-- 1. ASEGÚRATE DE QUE 'F' ESTÉ IMPORTADO
from django.utils import timezone
from datetime import timedelta, datetime

from .models import Producto, Venta, ItemVenta
from . import services 

from .serializers import (
    ProductoSerializer, 
    VentaSerializer,
    VentaCreateSerializer,
    ItemVentaSerializer
)

# 2. IMPORTAMOS EL SERIALIZER BÁSICO PARA LA NUEVA ACCIÓN
from rest_framework import serializers

# Decoradores de CSRF
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

# -----------------------------------------------------------------------------
# ViewSet para Producto (CRUD completo)
# -----------------------------------------------------------------------------
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('nombre')
    serializer_class = ProductoSerializer

    # Esto fuerza a Django a enviar la cookie CSRF
    @method_decorator(ensure_csrf_cookie, name='dispatch')
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    # --- 3. ¡NUEVA ACCIÓN AÑADIDA! ---
    # Esta acción crea la URL: /api/productos/<id>/add_stock/
    @action(detail=True, methods=['post'], url_path='add-stock')
    def add_stock(self, request, pk=None):
        """
        Acción personalizada para añadir stock a un producto.
        Espera un JSON como: { "cantidad": 10 }
        """
        try:
            cantidad = int(request.data.get('cantidad', 0))
            if cantidad <= 0:
                raise ValueError("La cantidad debe ser un número positivo.")
        except (ValueError, TypeError):
            return Response(
                {"detail": "Por favor, provea una 'cantidad' numérica válida."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Usamos self.get_object() para obtener el producto por su 'pk' (ID)
        producto = self.get_object()
        
        # Actualización atómica (segura)
        # Esto evita problemas si dos personas intentan sumar stock al mismo tiempo
        producto.stock = F('stock') + cantidad
        producto.save()
        
        # Refrescamos el objeto desde la BBDD para obtener el nuevo valor
        producto.refresh_from_db()
        
        # Devolvemos el producto actualizado
        serializer = self.get_serializer(producto)
        return Response(serializer.data, status=status.HTTP_200_OK)

# -----------------------------------------------------------------------------
# ViewSet para Venta
# -----------------------------------------------------------------------------
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha')
    serializer_class = VentaSerializer

    def get_queryset(self):
        queryset = super().get_queryset() 
        start_date_str = self.request.query_params.get('start_date', None)
        end_date_str = self.request.query_params.get('end_date', None)

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha__date__range=[start_date, end_date])
            except (ValueError, TypeError):
                pass 
        return queryset

    def get_serializer_class(self):
        # Usamos el serializer de escritura para CREAR y ACTUALIZAR
        if self.action in ['create', 'update', 'partial_update']:
            return VentaCreateSerializer
        return VentaSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            venta_creada = services.registrar_venta(serializer.validated_data)
            respuesta_serializer = VentaSerializer(venta_creada)
            return Response(respuesta_serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            try:
                detail = e.detail
            except AttributeError:
                detail = str(e)
            
            return Response(
                {"detail": detail}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='dashboard-data')
    def dashboard_data(self, request):
        
        start_date_str = request.query_params.get('start_date', None)
        end_date_str = request.query_params.get('end_date', None)

        if not start_date_str or not end_date_str:
            end_date = timezone.localdate()
            start_date = end_date - timedelta(days=6)
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Formato de fecha inválido. Usar YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        ventas_filtradas = Venta.objects.filter(fecha__date__range=[start_date, end_date])

        sales_by_day_dict = {}
        delta = end_date - start_date
        for i in range(delta.days + 1):
            date = start_date + timedelta(days=i)
            sales_by_day_dict[date.strftime('%Y-%m-%d')] = 0

        daily_sales = ventas_filtradas.values('fecha__date').annotate(daily_total=Sum('total_venta')).order_by('fecha__date')
        
        for sale in daily_sales:
            date_str = sale['fecha__date'].strftime('%Y-%m-%d')
            if date_str in sales_by_day_dict:
                sales_by_day_dict[date_str] = sale['daily_total']

        sales_by_day = [{'date': date, 'total': total} for date, total in sales_by_day_dict.items()]

        total_vendido = 0
        total_costo = 0
        
        ventas_optimizadas = ventas_filtradas.prefetch_related('items__producto')
        
        for venta in ventas_optimizadas:
            for item in venta.items.all():
                total_vendido += item.precio_en_el_momento * item.cantidad
                total_costo += item.producto.precio_costo * item.cantidad

        ganancia_neta = total_vendido - total_costo

        ventas_totales_historico = Venta.objects.aggregate(total=Sum('total_venta'))['total'] or 0
        productos_bajo_stock = Producto.objects.filter(stock__lte=F('stock_minimo')).order_by('nombre')
        productos_bajo_stock_serializer = ProductoSerializer(productos_bajo_stock, many=True)

        data = {
            'ventas_totales_historico': ventas_totales_historico,
            'productos_bajo_stock': productos_bajo_stock_serializer.data,
            'rango_total_vendido': total_vendido,
            'rango_total_costo': total_costo,
            'rango_ganancia_neta': ganancia_neta,
            'ventas_por_dia': sales_by_day,
        }
        return Response(data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# ViewSet para ItemVenta (Solo lectura, sin cambios)
# -----------------------------------------------------------------------------
class ItemVentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ItemVenta.objects.all()
    serializer_class = ItemVentaSerializer