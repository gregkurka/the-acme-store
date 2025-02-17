const pg = require("pg");
const client = new pg.Client();
const uuid = require("uuid");
const bcrypt = require("bcrypt");

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS favorite;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;

    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password VARCHAR(256) NOT NULL
    );

    CREATE TABLE products(
      id UUID PRIMARY KEY,
      name VARCHAR(64) NOT NULL
    );

    CREATE TABLE favorite(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      CONSTRAINT unique_user_favorite UNIQUE (user_id, product_id)
    );
  `;
  await client.query(SQL);
};

const createUser = async (username, password) => {
  const SQL = `
    INSERT INTO users (id, username, password)
    VALUES ($1, $2, $3)
    RETURNING id, username;
  `;
  const hashedPassword = await bcrypt.hash(password, 5);
  const { rows } = await client.query(SQL, [
    uuid.v4(),
    username,
    hashedPassword,
  ]);
  return rows[0];
};

const createProduct = async (name) => {
  const SQL = `
    INSERT INTO products (id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await client.query(SQL, [uuid.v4(), name]);
  return rows[0];
};

const createFavorite = async (userId, productId) => {
  const SQL = `
    INSERT INTO favorite (id, user_id, product_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await client.query(SQL, [uuid.v4(), userId, productId]);
  return rows[0];
};

const fetchUsers = async () => {
  const SQL = `SELECT id, username FROM users;`;
  const { rows } = await client.query(SQL);
  return rows;
};

const fetchProducts = async () => {
  const SQL = `SELECT * FROM products;`;
  const { rows } = await client.query(SQL);
  return rows;
};

const fetchFavorites = async (userId) => {
  const SQL = `
    SELECT f.id as favorite_id,
           p.id as product_id,
           p.name as product_name
      FROM favorite f
      JOIN products p
        ON f.product_id = p.id
     WHERE f.user_id = $1;
  `;
  const { rows } = await client.query(SQL, [userId]);
  return rows;
};

const destroyFavorite = async (favoriteId, userId) => {
  const SQL = `DELETE FROM favorite WHERE id = $1 AND user_id = $2;`;
  await client.query(SQL, [favoriteId, userId]);
  return true;
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
};
