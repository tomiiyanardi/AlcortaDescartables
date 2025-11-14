from django.contrib import admin
from django.urls import path, include # ¡Importante importar 'include'!

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Esta es la línea clave:
    path('api/', include('cotillon_api.urls')),
]