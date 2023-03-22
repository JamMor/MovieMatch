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
    
    def add_data(self, new_data):
        """Adds dictionary of new data to the data property."""
        self.data.update(new_data)

#This is a child class for an error json response
class FailedJsonClassObject(JsonClassObject):
    def __init__(self, message = "", errors = []):
        super().__init__(message)
        self.status = "failure"
        self.errors = errors
    
    def add_error(self, error):
        """Adds an error to the list of errors property."""
        self.errors.append(error)

#This is a base class for an elimination room socket command type
class CommandType():
    def __init__(self, command =""):
        self.command = command

#This is a child class for a successful json response to an elimination room socket command
class SuccessfulCommandResponse(SuccessJsonClassObject, CommandType):
    def __init__(self, message = "", data = {}, command = ""):
        super().__init__(message, data)
        CommandType.__init__(self, command)

#This is a child class for a failed json response to an elimination room socket command
class FailedCommandResponse(FailedJsonClassObject, CommandType):
    def __init__(self, message = "", errors = [], command = ""):
        super().__init__(message, errors)
        CommandType.__init__(self, command)