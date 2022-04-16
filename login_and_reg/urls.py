from django.urls import path
from . import views

app_name = "login_and_reg"
urlpatterns = [
    path('register', views.register_view, name="register"),
    path('login', views.login_view, name="login"),
    path('test', views.test_auth_view, name="test_auth"),
    path('logout', views.logout_view, name="logout")
]