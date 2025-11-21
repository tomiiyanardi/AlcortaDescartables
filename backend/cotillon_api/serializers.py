from rest_framework import serializers
from .models import Producto, Venta, ItemVenta
from decimal import Decimal
from django.db import transaction

# -----------------------------------------------------------------------------
# Serializer para Lectura/Escritura de Producto
# -----------------------------------------------------------------------------
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

# -----------------------------------------------------------------------------
# Serializer para Items (Lectura)
# -----------------------------------------------------------------------------
class ItemVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = ItemVenta
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_en_el_momento'] 
        read_only_fields = ['precio_en_el_momento']

# -----------------------------------------------------------------------------
# Serializer de Lectura de Venta (¡MODIFICADO!)
# -----------------------------------------------------------------------------
class VentaSerializer(serializers.ModelSerializer):
    items = ItemVentaSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        # AÑADIMOS 'metodo_pago' AQUÍ
        fields = ['id', 'fecha', 'total_venta', 'metodo_pago', 'items']
        read_only_fields = ['total_venta', 'fecha']

# -----------------------------------------------------------------------------
# Serializer de Escritura de Item
# -----------------------------------------------------------------------------
class VentaCreateItemSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=3) 

    def validate_cantidad(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("La cantidad debe ser mayor a cero.")
        return value

# -----------------------------------------------------------------------------
# Serializer de Escritura de Venta (¡MODIFICADO!)
# -----------------------------------------------------------------------------
class VentaCreateSerializer(serializers.Serializer):
    items = VentaCreateItemSerializer(many=True)
    # AÑADIMOS EL CAMPO PARA RECIBIR EL MÉTODO DE PAGO
    metodo_pago = serializers.ChoiceField(choices=Venta.METODOS_PAGO, default='EFECTIVO')

    def validate_items(self, items_data):
        if not items_data:
            raise serializers.ValidationError("La venta debe tener al menos un item.")
        producto_ids = [item['producto'].id for item in items_data]
        if len(producto_ids) != len(set(producto_ids)):
            raise serializers.ValidationError("No se pueden repetir productos en la misma venta.")
        return items_data

    # --- UPDATE (Con lógica de método de pago) ---
    def update(self, instance, validated_data):
        items_data = validated_data.get('items')
        # Actualizamos el método de pago si viene en la petición
        instance.metodo_pago = validated_data.get('metodo_pago', instance.metodo_pago)

        with transaction.atomic():
            # 1. Devolver stock original
            for item_viejo in instance.items.select_related('producto').all():
                producto = item_viejo.producto
                producto.stock += item_viejo.cantidad
                producto.save()
            
            # 2. Borrar items viejos
            instance.items.all().delete()

            # 3. Crear items nuevos
            total_venta_nuevo = Decimal('0.00')
            
            for item_data in items_data:
                producto = item_data['producto']
                cantidad = item_data['cantidad']
                
                producto.refresh_from_db()
                if producto.stock < cantidad:
                    raise serializers.ValidationError(f"Stock insuficiente para {producto.nombre}.")
                
                producto.stock -= cantidad
                producto.save()

                precio_momento = producto.precio_venta
                total_linea = precio_momento * cantidad
                total_venta_nuevo += total_linea

                ItemVenta.objects.create(
                    venta=instance,
                    producto=producto,
                    cantidad=cantidad,
                    precio_en_el_momento=precio_momento
                )

            # 4. Guardar
            instance.total_venta = total_venta_nuevo
            instance.save()

        return instance