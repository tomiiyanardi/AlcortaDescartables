from rest_framework import serializers
from .models import Producto, Venta, ItemVenta
from django.core.validators import MinValueValidator

# -----------------------------------------------------------------------------
# Serializer para Producto (Sin cambios, ya era limpio)
# -----------------------------------------------------------------------------
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# =============================================================================
# SERIALIZERS DE LECTURA (PARA RESPUESTAS GET)
# =============================================================================

# -----------------------------------------------------------------------------
# Serializer para MOSTRAR un ItemVenta (dentro de una Venta)
# -----------------------------------------------------------------------------
class ItemVentaSerializer(serializers.ModelSerializer):
    # Para mostrar el nombre en lugar de solo el ID
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = ItemVenta
        fields = ['id', 'producto_nombre', 'cantidad', 'precio_en_el_momento']
        # No se necesita 'producto' (ID) en la respuesta de lectura

# -----------------------------------------------------------------------------
# Serializer para MOSTRAR una Venta (Listado y Detalle)
# -----------------------------------------------------------------------------
class VentaSerializer(serializers.ModelSerializer):
    # Anidamos el serializer de lectura de Items
    items = ItemVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = ['id', 'fecha', 'total_venta', 'items']
        # Todos los campos son de lectura por defecto en este contexto

# =============================================================================
# SERIALIZERS DE ESCRITURA (PARA VALIDAR ENTRADAS POST)
# =============================================================================

# -----------------------------------------------------------------------------
# Serializer para VALIDAR un item en la petición de crear venta
# (No es un ModelSerializer, solo valida la entrada)
# -----------------------------------------------------------------------------
class VentaCreateItemSerializer(serializers.Serializer):
    # Usamos PrimaryKeyRelatedField para validar que el ID del producto exista
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(validators=[MinValueValidator(1)])

# -----------------------------------------------------------------------------
# Serializer para VALIDAR la petición de crear una Venta
# (No es un ModelSerializer, solo valida la entrada)
# -----------------------------------------------------------------------------
class VentaCreateSerializer(serializers.Serializer):
    # Espera una lista de items, validados por el serializer de arriba
    items = VentaCreateItemSerializer(many=True)

    def validate_items(self, items_data):
        # Validación extra: no permitir una venta sin items
        if not items_data:
            raise serializers.ValidationError("La venta debe tener al menos un item.")
        
        # Validación extra: no permitir productos duplicados en la misma venta
        # (El frontend debería manejar esto, pero es una buena defensa)
        producto_ids = [item['producto'].id for item in items_data]
        if len(producto_ids) != len(set(producto_ids)):
            raise serializers.ValidationError("No se pueden repetir productos en la misma venta.")
        
        return items_data