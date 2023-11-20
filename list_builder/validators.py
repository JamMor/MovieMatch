import re

from django.core.validators import RegexValidator
from django.utils.safestring import SafeString


class UserInputValidator(RegexValidator):
    """
    A custom validator for user input that checks if the input contains only letters, numbers, spaces, and basic punctuation.
    """
    allowed_chars = [
        " ", ",", ".", "!", "?",":", "'","\"", "$", "&", "+", "-", "(", ")"
    ]
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        additional_chars = "".join([re.escape(char) for char in self.allowed_chars])
        regex_string = f'^[\\w{additional_chars}]+\Z'
        self.regex = re.compile(regex_string)

        listed_chars = " ".join(self.allowed_chars)
        self.message = f'Name can only contain letters, numbers, spaces, basic punctuation: {listed_chars} characters.'
    
    def htmlPatternString(self):
        """
        Returns a regular expression string suitable for use in an HTML pattern attribute, 
        using unicode escape sequences for the allowed characters.

        :return: A regular expression pattern string.
        """
        additional_chars = "".join(['\\u{:04X}'.format(ord(char)) for char in self.allowed_chars])
        return f'[\\w{additional_chars}]+'
    
    def htmlTitleString(self):
        """
        Returns a string containing the allowed characters for a name, formatted as an HTML message,
        for use in the title attribute for HTML5 validation errors.

        Returns:
        html_title_string (str): A string containing the allowed characters for a name, formatted as an HTML message.
        """
        listed_chars = " ".join(['&#x{:04X};'.format(ord(char)) for char in self.allowed_chars])
        return SafeString(f'Name can only contain letters, numbers, spaces, basic punctuation: {listed_chars} characters.')
    