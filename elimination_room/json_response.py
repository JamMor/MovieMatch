#This is a base class for a json response
class JsonClassObject:
    def __init__(self, message:str = None):
        if message == None:
            message = ""
        self.message = message

    def to_dict(self):
        """This method returns a dictionary that can be used to create a JsonResponse"""
        return vars(self)

#This is a child class for a successful json response
class SuccessJsonClassObject(JsonClassObject):
    def __init__(self, message:str = None, data:dict[str,str] = None):
        super().__init__(message)
        self.status = "success"
        if data == None:
            data = {}
        self.data = data
    
    def add_data(self, new_data):
        """Adds dictionary of new data to the data property."""
        self.data.update(new_data)

#This is a child class for an error json response
class FailedJsonClassObject(JsonClassObject):
    def __init__(self, message:str = None, errors:list[str] = None):
        super().__init__(message)
        self.status = "failure"
        if errors == None:
            errors = []
        self.errors = errors
    
    def add_error(self, error):
        """Adds an error to the list of errors property."""
        self.errors.append(error)

#This is a base class for an elimination room socket command type
class CommandType():
    def __init__(self, command:str = None):
        if command == None:
            command = ""
        self.command = command

#This is a child class for a successful json response to an elimination room socket command
class SuccessfulCommandResponse(SuccessJsonClassObject, CommandType):
    def __init__(self, message:str = None, data:dict[str,str] = None, command:str = None):
        super().__init__(message, data)
        CommandType.__init__(self, command)

#This is a child class for a failed json response to an elimination room socket command
class FailedCommandResponse(FailedJsonClassObject, CommandType):
    def __init__(self, message:str = None, errors:list[str] = None, command:str = None):
        super().__init__(message, errors)
        CommandType.__init__(self, command)