from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Venta, ItemVenta, Producto

@transaction.atomic # ¡Clave! O todo funciona, o todo se deshace.
def registrar_venta(validated_data):
    """
    Crea una Venta y sus Items, actualizando el stock de Productos.
    Esta es la lógica de negocio principal para una transacción de venta.
    """
    items_data = validated_data.pop('items')
    
    # 1. Crear la Venta (aún sin total)
    venta = Venta.objects.create(total_venta=Decimal('0.00')) # Total temporal
    total_venta_calculado = Decimal('0.00')

    productos_a_actualizar = []
    items_a_crear = []

    for item_data in items_data:
        producto = item_data['producto']
        cantidad = item_data['cantidad']

        # 2. Verificar stock (usando .select_for_update() implícito por la transacción)
        if producto.stock < cantidad:
            # Si falla, la transacción (gracias a @transaction.atomic) lo revierte todo.
            raise ValidationError(f"No hay suficiente stock para {producto.nombre}. Stock actual: {producto.stock}")

        # 3. Preparar la lógica
        precio_en_el_momento = producto.precio_venta # Captura el precio actual
        total_linea = precio_en_el_momento * cantidad
        total_venta_calculado += total_linea

        # Descontar stock en el objeto de memoria
        producto.stock -= cantidad
        productos_a_actualizar.append(producto)

        # Preparar el ItemVenta
        items_a_crear.append(ItemVenta(
            venta=venta, 
            producto=producto, 
            cantidad=cantidad, 
            precio_en_el_momento=precio_en_el_momento
        ))

    # 4. Ejecutar las operaciones en la BBDD (de forma eficiente)
    
    # Guardar todos los items de una vez
    ItemVenta.objects.bulk_create(items_a_crear)
    
    # Actualizar el stock de todos los productos de una vez
    Producto.objects.bulk_update(productos_a_actualizar, ['stock'])
    
    # 5. Guardar el total final en la Venta
    venta.total_venta = total_venta_calculado
    venta.save()
    
    # Devolvemos la 'validated_data' original con la instancia de venta creada
    # El serializer necesita esto
    validated_data['items'] = items_data
    return venta, validated_data

@transaction.atomic
def actualizar_venta(venta_instance, validated_data):
    """
    Edita una venta existente.
    Estrategia: Revertir el stock de la venta original, borrar items,
    y volver a crear la venta con los nuevos datos.
    """
    items_data = validated_data.pop('items')

    # 1. REVERTIR STOCK (Devolver productos al estante)
    current_items = venta_instance.items.all()
    for item in current_items:
        producto = item.producto
        producto.stock += item.cantidad
        producto.save()
    
    # 2. Borrar items viejos
    current_items.delete()

    # 3. APLICAR NUEVA VENTA (Lógica idéntica a crear)
    total_venta_calculado = Decimal('0.00')
    items_a_crear = []
    productos_a_actualizar = []

    for item_data in items_data:
        producto = item_data['producto']
        cantidad = item_data['cantidad']

        # Verificar stock (ahora el stock incluye lo que acabamos de devolver)
        if producto.stock < cantidad:
             raise ValidationError(f"No hay suficiente stock para {producto.nombre}. Stock disponible: {producto.stock}")
        
        # Usamos el precio ACTUAL del producto (asumimos que si editas, actualizas precio)
        precio_en_el_momento = producto.precio_venta 
        
        producto.stock -= cantidad
        productos_a_actualizar.append(producto)
        
        total_venta_calculado += precio_en_el_momento * cantidad
        items_a_crear.append(ItemVenta(
            venta=venta_instance, 
            producto=producto, 
            cantidad=cantidad, 
            precio_en_el_momento=precio_en_el_momento
        ))

    ItemVenta.objects.bulk_create(items_a_crear)
    Producto.objects.bulk_update(productos_a_actualizar, ['stock'])
    
    venta_instance.total_venta = total_venta_calculado
    venta_instance.save()
    
    return venta_instance