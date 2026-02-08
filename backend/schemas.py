from backend.database import ma
from backend.models import User, Task, Category, Priority, Passkey

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash', 'totp_secret')

class CategorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Category
        load_instance = True

class PrioritySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Priority
        load_instance = True

class TaskSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_fk = True
    
    assignee = ma.Nested(UserSchema)
    category = ma.Nested(CategorySchema)
    priority = ma.Nested(PrioritySchema)

class PasskeySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Passkey
        load_instance = True
