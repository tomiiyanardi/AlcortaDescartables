from rest_framework import serializers
from .models import Producto, Venta, ItemVenta
from decimal import Decimal
from django.db import transaction

# Nota: 'services' ya no lo importamos aquí porque la lógica 
# de creación está en el servicio, pero la de edición la manejamos aquí
# para simplificar el serializer de escritura.

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
    # CAMBIO: Acepta Decimales (para peso)
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=3) 

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
        if not items_data:
            raise serializers.ValidationError("La venta debe tener al menos un item.")
        producto_ids = [item['producto'].id for item in items_data]
        if len(producto_ids) != len(set(producto_ids)):
            raise serializers.ValidationError("No se pueden repetir productos en la misma venta.")
        return items_data

    # --- MÉTODO DE ACTUALIZACIÓN (PUT) ---
    # Este método maneja la lógica compleja de devolver stock, borrar items
    # y crear los nuevos items con el nuevo stock.
    def update(self, instance, validated_data):
        items_data = validated_data.get('items')

        with transaction.atomic():
            # 1. PASO CRÍTICO: DEVOLVER STOCK DE *TODOS* LOS ITEMS ORIGINALES
            # Antes de borrar nada, devolvemos el stock de lo que había en la venta.
            # Usamos select_related para optimizar y traer el producto junto con el item.
            for item_viejo in instance.items.select_related('producto').all():
                producto = item_viejo.producto
                producto.stock += item_viejo.cantidad
                producto.save()
            
            # 2. ELIMINAR TODOS LOS ITEMS VIEJOS
            # Limpiamos la venta para reconstruirla desde cero con los datos nuevos.
            instance.items.all().delete()

            # 3. PROCESAR LA LISTA NUEVA (CREAR Y RESTAR STOCK)
            total_venta_nuevo = Decimal('0.00')
            
            for item_data in items_data:
                producto = item_data['producto']
                cantidad = item_data['cantidad']
                
                # Importante: Refrescamos el producto de la BBDD para tener el stock actualizado
                # (incluyendo lo que acabamos de devolver en el paso 1)
                producto.refresh_from_db()

                # Verificamos si hay stock suficiente para la NUEVA cantidad
                if producto.stock < cantidad:
                    raise serializers.ValidationError(
                        f"Stock insuficiente para {producto.nombre}. "
                        f"Stock disponible: {producto.stock}, Solicitado: {cantidad}"
                    )
                
                # Restamos el stock
                producto.stock -= cantidad
                producto.save()

                # Calculamos precio y total
                precio_momento = producto.precio_venta
                total_linea = precio_momento * cantidad
                total_venta_nuevo += total_linea

                # Creamos el item
                ItemVenta.objects.create(
                    venta=instance,
                    producto=producto,
                    cantidad=cantidad,
                    precio_en_el_momento=precio_momento
                )

            # 4. ACTUALIZAR TOTAL DE LA VENTA
            instance.total_venta = total_venta_nuevo
            instance.save()

        return instance