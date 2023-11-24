from django.urls import path

from . import views

app_name = "elimination_room"
urlpatterns = [
    path('', views.submit_to_elimination_session, name="elimination_session_submit"),
    path('<str:sharecode>', views.join_elimination_session, name="join_elimination_session"),
]
