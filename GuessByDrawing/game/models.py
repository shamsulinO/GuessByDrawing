from django.db import models


class Users(models.Model):
    uuid = models.CharField(max_length=255)
    username = models.CharField(max_length=255)
    avatar = models.CharField(max_length=255, default='avatar1.jpg')
    guessed_words = models.IntegerField(default=0)
    time_create = models.DateTimeField(auto_now_add=True)