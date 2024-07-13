from urllib.parse import urlencode

from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views import View
from django.views.generic import TemplateView
from .models import *

import uuid
import string
import random


class Main(TemplateView):
    template_name = 'game/index.html'

    def get_context_data(self, **kwargs):
        unique_id = self.request.session.get('unique_id', None)
        room_id = self.request.GET.get('room_id', None)

        if unique_id is None:
            unique_id = str(uuid.uuid4())
            self.request.session['unique_id'] = unique_id

        user = Users.objects.filter(uuid=unique_id).first()
        username = user.username if user else ''
        avatar = user.avatar if user else 'avatar1.jpg'

        context = {'title': 'Guess by drawing', 'username': username, 'avatar': avatar, 'room_id': room_id}
        return context


class Room(TemplateView):
    template_name = 'game/room.html'

    def get(self, request, *args, **kwargs):
        unique_id = self.request.session.get('unique_id', None)

        if unique_id is None:
            unique_id = str(uuid.uuid4())
            self.request.session['unique_id'] = unique_id

        user = Users.objects.filter(uuid=unique_id).first()

        if user is None:
            base_url = reverse('home')
            query_string = urlencode({'room_id': kwargs['room_id']})
            return redirect(f'{base_url}?{query_string}')

        username = user.username if user else ''

        context = {'title': 'Room', 'username': username, 'avatar': user.avatar, 'uuid': unique_id,
                   'room_id': kwargs['room_id']}
        return self.render_to_response(context)


def get_user_data(request, username, avatar_url):
    unique_id = request.session.get('unique_id', None)
    room_id = request.GET.get('room_id', None)

    if unique_id is None:
        unique_id = str(uuid.uuid4())
        request.session['unique_id'] = unique_id

    user = Users.objects.filter(uuid=unique_id).first()

    if user and (user.username != username or user.avatar != avatar_url):
        user.username = username
        user.avatar = avatar_url
        user.save()
    elif user is None:
        Users(uuid=unique_id, username=username, avatar=avatar_url).save()

    letters = string.ascii_lowercase
    rand_string = ''.join(random.choice(letters) for _ in range(8))

    if room_id:
        return redirect('room', room_id=room_id)
    else:
        return redirect('room', room_id=rand_string)
