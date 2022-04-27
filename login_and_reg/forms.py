from msilib.schema import Class
from django.db import models
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import password_validation
from django.forms.utils import ErrorList
from django.forms import ModelForm
from list_builder.models import UserUUID


class RegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)

        self.fields['username'].widget.attrs['class'] = 'validate'
        self.fields['password1'].widget.attrs['class'] = 'validate'
        self.fields['password2'].widget.attrs['class'] = 'validate'
        
        # self.fields['username'].help_text = ['Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.']
        # self.fields['password1'].help_text = password_validation.password_validators_help_texts()
        # self.fields['password2'].help_text = ["Enter the same password as before, for verification."]

    def is_valid(self):
         result = super().is_valid()
         # loop on *all* fields if key '__all__' found else only on errors:
         for x in (self.fields if '__all__' in self.errors else self.errors):
             attrs = self.fields[x].widget.attrs
             attrs.update({'class': attrs.get('class', '') + ' invalid'})
         return result


class UserUUIDForm(ModelForm):
    class Meta:
        model = UserUUID
        fields = ['nickname']



# class SpanErrorList(ErrorList):
#     def __str__(self):
#         return self.as_divs()

#     def as_divs(self):
#         if not self:
#             return ''
#         return '<div class="errorlist">%s</div>' % ''.join(['<div class="error">%s</div>' % e for e in self])