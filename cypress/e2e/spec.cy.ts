function sendHelloWorldMessage() {
  cy.get(".send-message-bar").type("Hello, world!");
  cy.get(".send-message-button").click();
}

function visitFrontend() {
  cy.visit("http://localhost:5173/frontend/dashboard");
}

function switchLanguageToEnglish() {
  cy.get("#switch-locale-button").click()
  cy.contains("Deutsch").click()
  cy.contains("English").click()
  cy.contains("Close").click()
}

function register(credentials: {email: string, password: string, username: string}) {
  switchLanguageToEnglish()

  cy.contains("or Sign up").click();
  cy.get("[name=email]").type(credentials.email);
  cy.get("[name=password]").type(credentials.password);
  cy.get("[name=passwordConfirm]").type(credentials.password);
  cy.get("[name=username]").type(credentials.username);
  cy.get("[type=submit]").click().wait(1000);
}

function signIn(credentials: {email: string, password: string, username: string}) {
  cy.wait(1000);
  cy.get("[name=email]").clear();
  cy.get("[name=email]").type(credentials.email);
  cy.get("[name=password]").clear();
  cy.get("[name=password]").type(credentials.password);
  cy.get("[type=submit]").click();
}

function signOut() {
  cy.get(".user-menu-button").click();
  cy.contains("Sign out").click();
}

function addContact(contactName: string) {
  cy.get(".sidebar").should("be.visible");
  cy.get("[name=contactName]").type(contactName);
  cy.contains(`${contactName} (add)`).click();
  cy.get("[name=contactName]").clear().blur();
}

const testUserCounter = 0;

const testUser = {
  email: `test@email.com`,
  password: "password",
  username: "JohnTest",
};

describe("template spec", () => {

  before(() => {
    visitFrontend();

    register(testUser);
  })

  beforeEach(() => {
    visitFrontend()
  })

  it("should have basic functionality working", () => {
    signIn(testUser);

    addContact("Florian");

    cy.get(".contact:first").click();
    cy.get(".send-audio-button").should("be.visible");

    sendHelloWorldMessage();

    cy.get(".chat-message").should("be.visible");
    cy.get("[name=chat-menu-button]").click();
    cy.contains("Delete messages").click();

    cy.get("[name=chat-menu-button]").click();
    cy.contains("Delete chat").click();

    addContact("Alex")
    addContact("Tom")

    cy.get(".user-menu-button").click();
    cy.contains("Create new group").click();

    cy.get("#group-members-input").click();
    cy.get("#group-members-input-option-0").click();

    cy.get("#group-members-input").click();
    cy.get("#group-members-input-option-1").click();

    cy.get("[name=create-group-button]").click();

    cy.contains("Alex, Tom").click();
    sendHelloWorldMessage();

    cy.get("[name=chat-menu-button]").click();
    cy.contains("Leave group").click()

    signOut()

    cy.contains("Sign in")
  });

  it("should throttle sign in", () => {
    switchLanguageToEnglish()

    for (let i = 0; i <= 4; i++) {
      signIn(testUser)
      signOut()
    }
    signIn(testUser)
    cy.contains("Too many requests in a short period of time")
  })
});
