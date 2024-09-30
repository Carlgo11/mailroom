#!/usr/bin/env node
const { Command } = require('commander')

const program = new Command();

// Set default base URL
let BASE_URL = 'http://localhost:6804';

// Command to override the base URL
program
.option('-u, --url <url>', 'set base URL for Controller API', (url) => {
  BASE_URL = url;
});

// Function to create a user
program
.command('create-user <email> <password>')
.description('Create a new email user')
.action(async (email, password) => {
  try {
    console.log(`Creating user: ${email}`);
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('User created:', data);
  } catch (err) {
    console.error('Error creating user:', err.message);
  }
});

// Function to delete a user
program
.command('delete-user <email>')
.description('Delete an existing email user')
.action(async (email) => {
  try {
    console.log(`Deleting user: ${email}`);
    const response = await fetch(`${BASE_URL}/users/${email}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    console.log('User deleted successfully.');
  } catch (err) {
    console.error('Error deleting user:', err.message);
  }
});

// Function to list all users
program
.command('list-users')
.description('List all email users')
.action(async () => {
  try {
    console.log('Existing users:');
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const users = await response.json();
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user}`);
    });
  } catch (err) {
    console.error('Error listing users:', err.message);
  }
});

// Function to get user details
program
.command('get-user <email>')
.description('Get details of a specific user')
.action(async (email) => {
  try {
    console.log(`${email} details:`);
    const response = await fetch(`${BASE_URL}/users/${email}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const userDetails = await response.json();
    for (const [key, value] of Object.entries(userDetails)) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error('Error getting user details:', err.message);
  }
});

// Function to generate a certificate for a user
program
.command('generate-cert <email>')
.description('Generate a client certificate for the user')
.action(async (email) => {
  try {
    console.log(`Generating certificate for user: ${email}`);
    const response = await fetch(`${BASE_URL}/users/${email}/generate-cert`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    console.log('Certificate generated successfully.');
  } catch (err) {
    console.error('Error generating certificate:', err.message);
  }
});

// Parse command-line arguments
program.parse(process.argv);

// Override the default base URL if the option is provided
const options = program.opts();
if (options.url) {
  BASE_URL = options.url;
}
