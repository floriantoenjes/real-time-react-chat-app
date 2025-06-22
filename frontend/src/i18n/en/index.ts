import type { BaseTranslation } from "../i18n-types.js";

const en = {
    LOGIN: "Login",
    EMAIL: "E-Mail",
    PASSWORD: "Password",
    CONFIRM_PASSWORD: "Confirm Password",
    SIGN_IN: "Sign in",
    SIGN_UP: "Sign up",
    SIGN_OUT: "Sign out",
    USERNAME: "Username",
    OR: "or",
    ADD: "add",
    ADD_CONTACT: "Filter for or add a contact",
    CREATE_GROUP: "Create new group",
    ADD_GROUP_MEMBERS: "Add group members",
    MEMBERS: "Members",
    EDIT_PROFILE: "Edit your Profile",
    ENTER_A_MESSAGE: "Enter a message",
    EMPTY_CHAT: "Delete messages",
    DELETE_CHAT: "Delete chat",
    OFFLINE_HINT: "You seem to be offline.",
    CHANGE_LANGUAGE: "Change language",
    CLOSE: "Close",
    ARCHIVED: "Archived",
    LOGGED_OUT: "You have been logged out successfully",
    CHAT_MESSAGES_DELETED: "Chat messages have been deleted",
    CONTACT_ADDED: "{name} has been added as a contact",
    REGISTERED_AND_SIGNED_IN:
        "Your account has been created and you have been signed in.",
    WS_CONNECTION_LOST:
        "The connection to the server has been lost. Reconnecting...",
    WS_CONNECTION_REESTABLISHED:
        "The connection to the server has been reestablished",
    CONTACT_REMOVED: "{name} is no longer a contact",
    AVATAR_UPDATED: "Your profile picture has been updated",
    ERROR: {
        COULD_NOT_FETCH_MESSAGES: "Could not fetch messages",
        COULD_NOT_LOGOUT: "An error occured. You have not been logged out.",
        COULD_NOT_DELETE_CHAT_MESSAGES: "Chat messages could not be deleted",
        COULD_NOT_ADD_CONTACT: "Error adding contact",
        AVATAR_NOT_UPDATED: "Your profile picture could not be updated",
        COULD_NOT_DELETE_CONTACT_GROUP: "Error deleting contact group",
        COULD_NOT_DELETE_CONTACT: "Error deleting contact",
    },
} satisfies BaseTranslation;

export default en;
