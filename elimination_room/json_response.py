#This is a base class for a json response
class JsonClassObject:
    def __init__(self, message = ""):
        self.message = message

    def to_dict(self):
        """This method returns a dictionary that can be used to create a JsonResponse"""
        return vars(self)

#This is a child class for a successful json response
class SuccessJsonClassObject(JsonClassObject):
    def __init__(self, message = "", data = {}):
        super().__init__(message)
        self.status = "success"
        self.data = data

#This is a child class for an error json response
class FailedJsonClassObject(JsonClassObject):
    def __init__(self, message = "", errors = []):
        super().__init__(message)
        self.status = "failure"
        self.errors = errors
    
    def add_error(self, error):
        """Adds an error to the list of errors property."""
        self.errors.append(error)