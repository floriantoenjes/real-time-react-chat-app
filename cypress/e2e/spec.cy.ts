function sendHelloWorldMessage() {
  cy.get(".send-message-bar").type("Hello, world!");
  cy.get(".send-message-button").click();
}

function signOut() {
  cy.get(".user-menu-button").click();
  cy.contains("Sign out").click();
}

describe("template spec", () => {
  it("passes", () => {
    const testUser = {
      email: "test@email.com",
      password: "password",
      username: "JohnTest",
    };

    cy.visit("http://localhost:5173/frontend/dashboard");

    cy.contains("or Sign Up").click();
    cy.get("[name=email]").type(testUser.email);
    cy.get("[name=password]").type(testUser.password);
    cy.get("[name=passwordConfirm]").type(testUser.password);
    cy.get("[name=username]").type(testUser.username);
    cy.get("[type=submit]").click();

    signOut();

    cy.get("[name=email]").clear();
    cy.get("[name=email]").type(testUser.email);
    cy.get("[name=password]").clear();
    cy.get("[name=password]").type(testUser.password);
    cy.get("[type=submit]").click();

    cy.get(".sidebar").should("be.visible");
    cy.get("[name=contactName]").type("Florian");
    cy.contains("Florian").click();
    cy.get("[name=contactName]").clear();

    cy.get(".contact:first").click();
    cy.get(".send-audio-button").should("be.visible");

    sendHelloWorldMessage();

    cy.get(".chat-message").should("be.visible");
    cy.get("[name=chat-menu-button]").click();
    cy.contains("Chat leeren").click();

    cy.get("[name=chat-menu-button]").click();
    cy.contains("Chat löschen").click();

    cy.get(".sidebar").should("be.visible");
    cy.get("[name=contactName]").type("Alex");
    cy.contains("Alex").click();
    cy.get("[name=contactName]").clear();

    cy.get(".sidebar").should("be.visible");
    cy.get("[name=contactName]").type("Tom");
    cy.contains("Tom").click();
    cy.get("[name=contactName]").clear();

    cy.get(".user-menu-button").click();
    cy.contains("New group").click();

    cy.get("#group-members-input").click();
    cy.get("#group-members-input-option-0").click();

    cy.get("#group-members-input").click();
    cy.get("#group-members-input-option-1").click();

    cy.get("[name=create-group-button]").click();

    cy.contains("Alex, Tom").click();
    sendHelloWorldMessage();
  });
});
