from django.contrib import admin
from django.urls import path, include

# 1. Importamos la vista de login de DRF
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),

    # 2. Creamos la URL para el Login
    # Cuando React envíe un POST a esta URL con 'username' y 'password',
    # esta vista devolverá el 'token'.
    path('api/login/', obtain_auth_token, name='api_token_auth'),

    # Nuestras URLs de siempre (productos, ventas, etc.)
    path('api/', include('cotillon_api.urls')),
]