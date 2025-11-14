from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta, datetime # Importación de Datetime

from .models import Producto, Venta, ItemVenta
from . import services 

from .serializers import (
    ProductoSerializer, 
    VentaSerializer,
    VentaCreateSerializer,
    ItemVentaSerializer
)

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

# -----------------------------------------------------------------------------
# ViewSet para Venta (MODIFICADO para usar serializers/servicios)
# -----------------------------------------------------------------------------
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha')
    serializer_class = VentaSerializer

    # --- ¡ESTE ES EL MÉTODO QUE AÑADIMOS EN EL PASO 25! ---
    def get_queryset(self):
        """
        Sobrescribe el queryset para filtrar por rango de fechas
        si se proveen 'start_date' y 'end_date' en la URL.
        """
        # Obtenemos el queryset base (todas las ventas)
        queryset = super().get_queryset() 
        
        start_date_str = self.request.query_params.get('start_date', None)
        end_date_str = self.request.query_params.get('end_date', None)

        if start_date_str and end_date_str:
            try:
                # Convertimos las fechas y filtramos
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                # Usamos __range para filtrar entre las dos fechas (inclusive)
                queryset = queryset.filter(fecha__date__range=[start_date, end_date])
            except (ValueError, TypeError):
                # Si las fechas son inválidas, no filtramos nada
                pass 

        return queryset
    # -------------------------------------------------------

    def get_serializer_class(self):
        if self.action == 'create':
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
            # Captura cualquier error del servicio (ej. stock)
            try:
                # Intenta obtener el 'detail' si es una ValidationError de DRF
                detail = e.detail
            except AttributeError:
                detail = str(e)
            
            return Response(
                {"detail": detail}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    # --------------------------------------------
    # Dashboard (Este es el código actualizado del Dashboard)
    # --------------------------------------------
    @action(detail=False, methods=['get'], url_path='dashboard-data')
    def dashboard_data(self, request):
        
        # --- Lógica de Fechas ---
        start_date_str = request.query_params.get('start_date', None)
        end_date_str = request.query_params.get('end_date', None)

        # Determinar el rango de fechas
        if not start_date_str or not end_date_str:
            end_date = timezone.localdate()
            start_date = end_date - timedelta(days=6) # Últimos 7 días
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Formato de fecha inválido. Usar YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Filtrar las ventas para los KPIs y el gráfico
        ventas_filtradas = Venta.objects.filter(fecha__date__range=[start_date, end_date])

        # --- Cálculos del Gráfico (Ventas por día) ---
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

        # --- CÁLCULOS DE GANANCIA (KPIs del Rango) ---
        total_vendido = 0
        total_costo = 0
        
        ventas_optimizadas = ventas_filtradas.prefetch_related('items__producto')
        
        for venta in ventas_optimizadas:
            for item in venta.items.all():
                total_vendido += item.precio_en_el_momento * item.cantidad
                total_costo += item.producto.precio_costo * item.cantidad

        ganancia_neta = total_vendido - total_costo

        # --- KPIs Históricos (se mantienen) ---
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