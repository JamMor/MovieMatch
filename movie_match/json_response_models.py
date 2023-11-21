# This is a base class for a json response
class JsonClassObject:
    def __init__(self, message: str = None):
        if message == None:
            message = ""
        self.message = message

    def to_dict(self):
        """This method returns a dictionary that can be used to create a JsonResponse"""
        return vars(self)



# This is a child class for a successful json response
class SuccessJsonClassObject(JsonClassObject):
    def __init__(self, message: str = None, data: dict[str, str] = None):
        super().__init__(message)
        self.status = "success"
        if data == None:
            data = {}
        self.data = data

    def add_data(self, new_data):
        """Adds dictionary of new data to the data property."""
        self.data.update(new_data)



# This is a child class for an error json response
class FailedJsonClassObject(JsonClassObject):
    def __init__(self, message: str = None, errors: list[str] = None):
        super().__init__(message)
        self.status = "failure"
        if errors == None:
            errors = []
        self.errors = errors

    def add_error(self, error):
        """Adds an error to the list of errors property."""
        self.errors.append(error)



# This is a child class for a failed json response to an elimination room socket command
class FailedFormResponse(FailedJsonClassObject):
    def __init__(self, message: str = None, errors: list[str] = None, form_errors: dict[str, str] = None):
        super().__init__(message, errors)
        if form_errors == None:
            form_errors = {}
        self.form_errors = form_errors

    def clear_form_errors(self):
        """Clears the form_errors property."""
        self.form_errors = {}

    def add_to_field_errors(self, field: str, *errors: str):
        """
        Adds a list of errors to the form_errors property.

        :param field: The field name to add errors to.
        :param errors: A tuple of errors to add to the field.
        """
        if field not in self.form_errors:
            self.form_errors[field] = []
        self.form_errors[field].extend(errors)

    def clear_field_errors(self, field: str):
        """
        Clears the list of errors for a field.

        :param field: The field name to clear errors for.
        """
        if field in self.form_errors:
            del self.form_errors[field]

    def combine_form_errors(self, form_error_dict: dict[str, list[str]], prefix: str = None):
        """
        Combines the form_errors property with another dictionary of errors.

        :param form_error_dict: A dictionary of errors to combine with the form_errors property.
        :param prefix: A prefix to add to the field names of the form_error_dict dictionary.
        """
        for field, errors in form_error_dict.items():
            if prefix and field != '__all__':
                field = f'{prefix}-{field}'
            self.add_to_field_errors(field, *errors)
