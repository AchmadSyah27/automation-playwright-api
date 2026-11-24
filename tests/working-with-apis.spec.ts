import { test, expect } from '@playwright/test';
import { before } from 'node:test';
import tags from '../test-data/tags.json';

test('has title', async ({ page }) => {
  //Melakukan mocking response API endpoint /api/tags
  await page.route('*/**/api/tags', async route => {
    //Melakukan fulfill response dengan data yang sudah kita siapkan di file tags.json
    await route.fulfill({
      json:tags
    })
  })

  await page.route('*/**/api/articles*', async route => {
    // Melakukan mocking API endpoint article
    const response = await route.fetch();
    const responseJSON = await response.json();
    responseJSON.articles[0].title = 'This is a Mock title for the article';
    responseJSON.articles[0].description = 'This is a Mock description for the article';
    await route.fulfill({
      json: responseJSON
    })
  });

  await page.goto('https://conduit.bondaracademy.com/');

  // Expect a title "to contain" a substring.
  await expect(page.locator('.navbar-brand')).toHaveText(/conduit/);
  
  //Jika tidak ditambahkan assertion dibawah ini, maka konfigurasi yang sudah kita setup tidak berubah di halaman web-nya
  await expect(page.locator('.sidebar .tag-pill')).toContainText(['Automation', 'Playwright']);

  //Menambahkan artikel dengan mocking yang sudah di set
  await expect(page.locator('.preview-link h1').first()).toContainText('This is a Mock title for the article');
  await expect(page.locator('.preview-link p').first()).toContainText('This is a Mock description for the article');
});

test('Delete article', async ({ page, request }) => {
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

  const newArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
    data: {
      "article": {
        "title": "Test title",
        "description": "Test description",
        "body": "Test body",
        "tagList": []
      }
    },
    headers: {
      'Authorization': `Token ${token}`
    }
  });
  expect (newArticleResponse.status()).toEqual(201);

  //Melakukan login di UI untuk memastikan artikel yang sudah dibuat muncul di halaman web
  await page.goto('https://conduit.bondaracademy.com/');
  

  //Melakukan submit artikel melalui API, lalu menghapus artikel tersebut, dan memastikan artikel sudah tidak ada di halaman web
  await expect(page.locator('.preview-link h1').first()).toContainText('Test title');
  await page.getByText('Test title').click();
  await page.getByRole('button', { name: 'Delete Article' }).first().click();
  await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0');
  await expect(page.locator('.preview-link h1').first()).not.toContainText('Test title');
});

test('Create article', async ({ page, request }) => {
  //Melakukan login di UI untuk memastikan artikel yang sudah dibuat muncul di halaman web
  await page.goto('https://conduit.bondaracademy.com/');
  

  //Membuat artikel baru melalui UI, dan mempublish artikel
  await page.getByText('New Article').click();
  await page.getByRole('textbox', { name: 'Article Title' }).fill('This is Test title');
  await page.getByRole('textbox', { name: 'What\'s this article about?' }).fill('This is Test description');
  await page.getByRole('textbox', { name: 'Write your article (in markdown)' }).fill('This is Test body');
  await page.getByRole('button', { name: 'Publish Article' }).click();

  //Melakukan ekstrak value slug dari sebuah artikel yang akan dilakukan publish atau hapus
  const newArticleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
  const articleResponseJson = await newArticleResponse.json();
  const slugID = articleResponseJson.article.slug;

  //Memastikan artikel baru sudah tampil di halaman web
  await expect(page.locator('.article-page h1')).toContainText('This is Test title');
  await page.getByText('Home').first().click();
  await expect(page.locator('.article-preview h1').first()).toContainText('This is Test title');

  //Menghapus artikel yang baru ditambahkan
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

  const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugID}`, {
    headers: {
      'Authorization': `Token ${token}`
    }
  });
  expect (deleteResponse.status()).toEqual(204);
})