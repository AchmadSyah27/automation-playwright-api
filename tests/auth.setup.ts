import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, request }) => {
  if (fs.existsSync(authFile)) {
    const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
      data:{
        "user": {
          "email": "andrian.soedjadi18@gmail.com",
          "password": "Qwerty999!"
        }
      }
  })
  expect (loginResponse.status()).toEqual(200);
  const responseJSON = await loginResponse.json();
  const token = responseJSON.user.token;
  console.log('Token: ' + token);

  const storageStateFile = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  storageStateFile.origins[0].localStoreage[0].value = token;
  fs.writeFileSync(authFile, JSON.stringify(storageStateFile, null, 2));

  }else{
  //Melakukan login di UI untuk memastikan artikel yang sudah dibuat muncul di halaman web
  await page.goto('https://conduit.bondaracademy.com/');
  await page.getByText('Sign in').click();
  await page.getByRole('textbox', { name: 'Email' }).fill('andrian.soedjadi18@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('Qwerty999!');
  await page.getByRole('button', { name: 'Sign in' }).click();
 
  await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
  }
});