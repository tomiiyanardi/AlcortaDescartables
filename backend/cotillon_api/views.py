from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta

from .models import Producto, Venta, ItemVenta
# Importamos nuestros servicios
from . import services 

# Importamos TODOS los serializers que creamos
from .serializers import (
    ProductoSerializer, 
    VentaSerializer,         # Serializer de LECTURA (GET)
    VentaCreateSerializer,   # Serializer de ESCRITURA (POST)
    ItemVentaSerializer
)

# -----------------------------------------------------------------------------
# ViewSet para Producto (Sin cambios, ya era correcto)
# -----------------------------------------------------------------------------
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('nombre')
    serializer_class = ProductoSerializer

# -----------------------------------------------------------------------------
# ViewSet para Venta (MODIFICADO para usar serializers/servicios)
# -----------------------------------------------------------------------------
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().order_by('-fecha')
    # Definimos el serializer por defecto (para GET)
    serializer_class = VentaSerializer

    def get_serializer_class(self):
        """
        Sobrescribimos este método para usar un serializer diferente
        para la acción 'create' (POST).
        """
        if self.action == 'create':
            return VentaCreateSerializer
        # Para 'list', 'retrieve', 'update', etc., usamos el de lectura
        return VentaSerializer

    def create(self, request, *args, **kwargs):
        """
        Sobrescribimos el método 'create' para llamar a nuestro servicio.
        """
        # 1. Validar los datos de entrada con el serializer de ESCRITURA
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # 2. Llamar al servicio con los datos validados
            # La lógica de negocio (stock, transacción) está en el servicio
            venta_creada = services.registrar_venta(serializer.validated_data)
            
            # 3. Preparar la respuesta JSON usando el serializer de LECTURA
            # Esto nos da el JSON de la venta recién creada, incluyendo los items
            respuesta_serializer = VentaSerializer(venta_creada)
            
            return Response(respuesta_serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            # 4. Si el servicio falla (ej. ValidationError por falta de stock)
            # capturamos el error y devolvemos un 400
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    # --------------------------------------------
    # Dashboard (sin cambios)
    # --------------------------------------------
    @action(detail=False, methods=['get'], url_path='dashboard-data')
    def dashboard_data(self, request):
        today = timezone.localdate()
        seven_days_ago = today - timedelta(days=6)

        # Ventas totales
        ventas_totales = Venta.objects.aggregate(total=Sum('total_venta'))['total'] or 0

        # Ventas por día de la última semana
        sales_by_day = []
        for i in range(7):
            date = seven_days_ago + timedelta(days=i)
            daily_sales = Venta.objects.filter(
                fecha__date=date
            ).aggregate(daily_total=Sum('total_venta'))['daily_total'] or 0
            sales_by_day.append({
                'date': date.strftime('%Y-%m-%d'),
                'total': daily_sales
            })
        
        # Productos con stock bajo (stock <= stock_minimo)
        productos_bajo_stock = Producto.objects.filter(stock__lte=F('stock_minimo')).order_by('nombre')
        productos_bajo_stock_serializer = ProductoSerializer(productos_bajo_stock, many=True)

        data = {
            'ventas_totales': ventas_totales,
            'ventas_por_dia_ultima_semana': sales_by_day,
            'productos_bajo_stock': productos_bajo_stock_serializer.data,
        }
        return Response(data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# ViewSet para ItemVenta (Solo lectura, sin cambios)
# -----------------------------------------------------------------------------
class ItemVentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ItemVenta.objects.all()
    serializer_class = ItemVentaSerializer