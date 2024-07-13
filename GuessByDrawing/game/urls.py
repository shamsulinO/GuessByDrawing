from django.urls import path
from .views import *

urlpatterns = [
    path('', Main.as_view(), name='home'),
    path('room/<str:room_id>', Room.as_view(), name='room'),

    path('get_user_data/<str:username>/<str:avatar_url>', get_user_data, name='get_user_data')
]
