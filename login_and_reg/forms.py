from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import ModelForm

from list_builder.models import Persona


class RegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)

        self.fields['username'].widget.attrs['class'] = 'validate'
        self.fields['password1'].widget.attrs['class'] = 'validate'
        self.fields['password2'].widget.attrs['class'] = 'validate'
        
    def is_valid(self):
         result = super().is_valid()
         # loop on *all* fields if key '__all__' found else only on errors:
         for x in (self.fields if '__all__' in self.errors else self.errors):
             attrs = self.fields[x].widget.attrs
             attrs.update({'class': attrs.get('class', '') + ' invalid'})
         return result


class PersonaForm(ModelForm):
    class Meta:
        model = Persona
        fields = ['nickname']

    def __init__(self, *args, **kwargs):
        super(PersonaForm, self).__init__(*args, **kwargs)

        self.fields['nickname'].widget.attrs['class'] = 'validate'

    def is_valid(self):
        result = super().is_valid()
        if 'nickname' in self.errors:
            attrs = self.fields['nickname'].widget.attrs
            attrs.update({'class': attrs.get('class', '') + ' invalid'})
        return result
