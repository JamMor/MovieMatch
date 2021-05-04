from django.db import models
import re
import bcrypt
import time

class UserManager(models.Manager):
    def registration_validator(self, postData):
        errors = {}

        if len(postData['name']) < 2:
            errors['name'] = "First name must be greater than two characters."
        elif not postData['name'].isalpha():
            errors['name'] = "First name can only contain letters."

        EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$')
        if 'email' not in postData:
            errors['email'] = "Must provide email address."
        elif not EMAIL_REGEX.match(postData['email']):
            errors['email'] = "Not a valid email address."
        elif len(User.objects.filter(email=postData['email'])) > 0:
            errors['email'] = "Address already registered."

        if len(postData['password']) < 8:
            errors['password'] = "Password must be at least 8 characters."
        elif postData['password'] != postData['confirmation']:
            errors['password'] = "Passwords don't match."

        return errors


    def login_validator(self,postData):
        errors = {}

        EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$')
        if postData['email'] == 0:
            errors['email'] = "Must provide email address."
        elif not EMAIL_REGEX.match(postData['email']):
            errors['email'] = "Not a valid email address."
        elif len(User.objects.filter(email=postData['email'])) == 0:
            errors['email'] = "Address not registered."
        
        elif len(postData['password']) == 0:
            errors['password'] = "Must enter a password."
        elif not bcrypt.checkpw(postData['password'].encode(), User.objects.filter(email=postData['email'])[0].password.encode()):
            errors['password'] = "Does not match."

        return errors

# Create your models here.
class User(models.Model):
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()

    def __str__(self):
        return self.name