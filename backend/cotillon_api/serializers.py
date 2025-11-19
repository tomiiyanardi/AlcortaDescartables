from rest_framework import serializers
from .models import Producto, Venta, ItemVenta
from decimal import Decimal
from . import services # Necesario para llamar a la lógica de actualización

# -----------------------------------------------------------------------------
# Serializer para Lectura/Escritura de Producto
# -----------------------------------------------------------------------------
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# -----------------------------------------------------------------------------
# Serializer para Items (Lectura en Historial/Edición)
# -----------------------------------------------------------------------------
class ItemVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = ItemVenta
        # Incluimos 'producto' (el ID) para que el frontend pueda editar la venta
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_en_el_momento'] 
        read_only_fields = ['precio_en_el_momento']

# -----------------------------------------------------------------------------
# Serializer de Lectura de Venta (Solo para GET)
# -----------------------------------------------------------------------------
class VentaSerializer(serializers.ModelSerializer):
    # Anidamos el serializer de ItemVenta para mostrar el detalle de la venta
    items = ItemVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = ['id', 'fecha', 'total_venta', 'items']
        read_only_fields = ['total_venta', 'fecha']

# -----------------------------------------------------------------------------
# Serializer de Escritura de Item (Para POST/PUT)
# -----------------------------------------------------------------------------
class VentaCreateItemSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    # CAMBIO: Acepta Decimales
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=2) 

    def validate_cantidad(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("La cantidad debe ser mayor a cero.")
        return value

# -----------------------------------------------------------------------------
# Serializer de Escritura de Venta (Para POST/PUT/PATCH)
# -----------------------------------------------------------------------------
class VentaCreateSerializer(serializers.Serializer):
    items = VentaCreateItemSerializer(many=True)

    def validate_items(self, items_data):
        # Validación: no permitir venta sin items
        if not items_data:
             raise serializers.ValidationError("La venta debe tener al menos un item.")
        return items_data

    # MÉTODO PARA CREAR (POST)
    def create(self, validated_data):
        venta, _ = services.registrar_venta(validated_data)
        return venta
    
    # MÉTODO PARA ACTUALIZAR (PUT/PATCH)
    def update(self, instance, validated_data):
        return services.actualizar_venta(instance, validated_data)