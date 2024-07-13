import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from django.templatetags.static import static
from django.contrib.sessions.models import Session

import os

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ChatApp.settings')
# import django
# django.setup()

from .models import *

servers_information = {}
server_ready_players = []


class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"game_{self.room_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        session_key = self.scope.get("session").session_key
        session = await sync_to_async(Session.objects.get)(session_key=session_key)
        unique_id = session.get_decoded().get("unique_id")
        user = await sync_to_async(Users.objects.get)(uuid=unique_id)
        static_url = static(f'game/image/avatars/{user.avatar}')

        if self.room_id not in servers_information:
            servers_information[self.room_id] = []

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "connect.message", 'message_type': 'new_connect', "static_url_avatar": static_url,
             'username': user.username, 'uuid': unique_id})

        if len(servers_information[self.room_id]) != 0:
            usernames, static_url_avatars, ready_status = [], [], []

            for users in servers_information[self.room_id]:
                user = await sync_to_async(Users.objects.get)(uuid=users)
                static_url = static(f'game/image/avatars/{user.avatar}')
                usernames.append(user.username)
                static_url_avatars.append(static_url)
                if users in server_ready_players:
                    ready_status.append(True)
                else:
                    ready_status.append(False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "multi_connect.message", 'message_type': 'multi_connect', 'for_user': unique_id,
                 'ready_status': ready_status,
                 "static_url_avatars": static_url_avatars, 'usernames': usernames,
                 'uuids': servers_information[self.room_id]})

        servers_information[self.room_id].append(unique_id)

    async def disconnect(self, close_code):
        session_key = self.scope.get("session").session_key
        session = await sync_to_async(Session.objects.get)(session_key=session_key)
        unique_id = session.get_decoded().get("unique_id")

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "disconnect.message", 'message_type': 'disconnect', 'uuid': unique_id})

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        servers_information[self.room_id].remove(unique_id)
        if servers_information[self.room_id] == []:
            del servers_information[self.room_id]

        if unique_id in server_ready_players:
            server_ready_players.remove(unique_id)

    async def receive(self, text_data):
        if text_data:
            text_data_json = json.loads(text_data)
            type_send = text_data_json['type_send']

            if type_send == 'text':
                message = text_data_json["message"]
                username = text_data_json['username']

                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "chat.message", 'message_type': type_send,
                                           "message": message, 'username': username})

            elif type_send == 'coordinates':
                coordinates = text_data_json["coordinates"]
                color = text_data_json['color']
                brush_size = text_data_json['brushSize']

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "coordinates.message", 'message_type': type_send, "coordinates": coordinates,
                     'color': color, 'brush_size': brush_size}
                )

            elif type_send == 'ready':
                userUUID = text_data_json["userUUID"]
                server_ready_players.append(userUUID)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "ready.message", 'message_type': type_send, "userUUID": userUUID})

            elif type_send == 'unready':
                uuid = text_data_json["uuid"]
                if uuid in server_ready_players:
                    server_ready_players.remove(uuid)

            elif type_send == 'save_word':
                word = text_data_json['word']
                type_send = text_data_json['type_send']

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "word.message", 'message_type': type_send, "word": word})

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        username = event['username']
        message_type = event['message_type']
        await self.send(text_data=json.dumps({'message_type': message_type, "message": message, 'username': username}))

    async def coordinates_message(self, event):
        message_type = event['message_type']
        coordinates = event['coordinates']
        color = event['color']
        brush_size = event['brush_size']
        await self.send(text_data=json.dumps({'message_type': message_type, 'coordinates': coordinates,
                                              'color': color, 'brush_size': brush_size}))

    async def connect_message(self, event):
        message_type = event['message_type']
        static_url_avatar = event['static_url_avatar']
        username = event['username']
        uuid = event['uuid']
        await self.send(text_data=json.dumps({'message_type': message_type, 'static_url_avatar': static_url_avatar,
                                              'username': username, 'uuid': uuid}))

    async def disconnect_message(self, event):
        message_type = event['message_type']
        uuid = event['uuid']
        await self.send(text_data=json.dumps({'message_type': message_type, 'uuid': uuid}))

    async def multi_connect_message(self, event):
        message_type = event['message_type']
        for_user = event['for_user']
        ready_status = event['ready_status']
        static_url_avatars = event['static_url_avatars']
        usernames = event['usernames']
        uuids = event['uuids']
        await self.send(text_data=json.dumps({'message_type': message_type, 'for_user': for_user,
                                              'ready_status': ready_status, 'static_url_avatars': static_url_avatars,
                                              'usernames': usernames, 'uuids': uuids}))

    async def ready_message(self, event):
        message_type = event['message_type']
        userUUID = event['userUUID']
        await self.send(text_data=json.dumps({'message_type': message_type, 'userUUID': userUUID}))

    async def word_message(self, event):
        message_type = event['message_type']
        word = event['word']
        await self.send(text_data=json.dumps({'message_type': message_type, 'word': word}))
