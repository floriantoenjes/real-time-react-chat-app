import type { Translation } from "../i18n-types.js";

const de = {
    LOGIN: "Login",
    EMAIL: "E-Mail",
    PASSWORD: "Passwort",
    CONFIRM_PASSWORD: "Passwort bestätigen",
    SIGN_IN: "Einloggen",
    SIGN_UP: "Registrieren",
    SIGN_OUT: "Ausloggen",
    USERNAME: "Benutzername",
    OR: "oder",
    ADD: "hinzufügen",
    ADD_CONTACT: "Kontakte filtern oder hinzufügen",
    CREATE_GROUP: "Neue Gruppe erstellen",
    ADD_GROUP_MEMBERS: "Gruppenmitglieder hinzufügen",
    MEMBERS: "Mitglieder",
    EDIT_PROFILE: "Profil bearbeiten",
    ENTER_A_MESSAGE: "Gib eine Nachricht ein",
    EMPTY_CHAT: "Chat leeren",
    DELETE_CHAT: "Chat löschen",
    OFFLINE_HINT: "Du scheinst offline zu sein",
    CHANGE_LANGUAGE: "Sprache wechseln",
    CLOSE: "Schließen",
    ARCHIVED: "Archiviert",
    LOGGED_OUT: "Du wurdest erfolgreich ausgeloggt",
    CHAT_MESSAGES_DELETED: "Chat-Nachrichten erfolgreich gelöscht",
    CONTACT_ADDED: "{name} wurde als Kontakt hinzugefügt",
    REGISTERED_AND_SIGNED_IN:
        "Dein Account wurde erstellt und du wurdest eingeloggt",
    WS_CONNECTION_LOST:
        "Die Verbindung zum Server wurde getrennt. Verbinden...",
    WS_CONNECTION_REESTABLISHED:
        "Die Verbindung zum Server wurde wiederhergestellt",
    CONTACT_REMOVED: "{name} ist kein Kontakt mehr",
    AVATAR_UPDATED: "Profilbild wurde aktualisiert",
    ERROR: {
        COULD_NOT_FETCH_MESSAGES: "Chat-Nachrichten konnte nicht geholt werden",
        COULD_NOT_LOGOUT: "Fehler beim Ausloggen",
        COULD_NOT_DELETE_CHAT_MESSAGES:
            "Chat-Nachrichten konnten nicht gelöscht werden",
        COULD_NOT_ADD_CONTACT: "Kontakt konnte nicht hinzugefügt werden",
        AVATAR_NOT_UPDATED: "Profilbild konnte nicht aktualisiert werden",
        COULD_NOT_DELETE_CONTACT_GROUP: "Gruppe konnte nicht entfernt werden",
        COULD_NOT_DELETE_CONTACT: "Kontakt konnte nicht entfernt werden",
    },
    EMAIL_OR_PASSWORD_INCORRECT: "E-Mail oder Passwort sind inkorrekt",
} satisfies Translation;

export default de;
