from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    # Standard Django admin interface
    path('admin/', admin.site.urls),
    
    # Your API endpoints, including admin routes
    path('api/', include('accounts.urls')),
    
    # Add this to redirect root to admin if user is admin
    path('', views.redirect_based_on_role, name='root_redirect'),
]
