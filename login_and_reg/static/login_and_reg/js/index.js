import * as DeleteAccount from './account_delete_modal.js';
import * as ChangeNickname from './change_nickname_modal.js'
import * as ChangePassword from './change_password_modal.js'

$(document).ready(function() {
    DeleteAccount.init();
    ChangeNickname.init();
    ChangePassword.init();
});