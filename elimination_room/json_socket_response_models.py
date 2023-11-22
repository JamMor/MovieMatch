from movie_match.json_response_models import (
    FailedJsonClassObject,
    SuccessJsonClassObject,
)


# This is a base class for an elimination session socket command type
class CommandType():
    def __init__(self, command: str = None):
        if command == None:
            command = ""
        self.command = command

# This is a child class for a successful json response to an elimination session socket command


class SuccessfulCommandResponse(SuccessJsonClassObject, CommandType):
    def __init__(self, message: str = None, data: dict[str, str] = None, command: str = None):
        super().__init__(message, data)
        CommandType.__init__(self, command)

# This is a child class for a failed json response to an elimination session socket command


class FailedCommandResponse(FailedJsonClassObject, CommandType):
    def __init__(self, message: str = None, errors: list[str] = None, command: str = None):
        super().__init__(message, errors)
        CommandType.__init__(self, command)
