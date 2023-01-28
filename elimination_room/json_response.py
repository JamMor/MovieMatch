#This is a base class for a json response
class JsonClassObject:
    def __init__(self, message = ""):
        self.message = message


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
