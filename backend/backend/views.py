from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

@login_required
def redirect_based_on_role(request):
    """
    Redirects users based on their role:
    - Admin/staff users go to the admin interface
    - Regular users go to the dashboard
    """
    if request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
        return redirect('/admin/')
    else:
        return redirect('/dashboard/')  # Or wherever regular users should go