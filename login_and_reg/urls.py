from django.urls import path
from . import views

app_name = "login_and_reg"
urlpatterns = [
    path('register', views.register_view, name="register"),
    path('login', views.login_view, name="login"),
    path('logout', views.logout_view, name="logout"),
    path('settings', views.account_settings_view, name="settings"),
    path('settings/delete-account', views.delete_account_view, name="delete_account"),
]