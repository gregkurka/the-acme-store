const express = require("express");
const app = express();
require("dotenv").config();
const morgan = require("morgan");

const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
} = require("./db");

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

app.get("/api/users", async (req, res, next) => {
  try {
    const users = await fetchUsers();
    res.send(users);
  } catch (err) {
    next(err);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    const products = await fetchProducts();
    res.send(products);
  } catch (err) {
    next(err);
  }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const favorites = await fetchFavorites(userId);
    res.send(favorites);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({
        message: "Please provide both username and password",
      });
    }
    const newUser = await createUser(username, password);
    res.status(201).send(newUser);
  } catch (err) {
    next(err);
  }
});

app.post("/api/products", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .send({ message: "Please provide a product name." });
    }
    const newProduct = await createProduct(name);
    res.status(201).send(newProduct);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { product_id } = req.body;
    if (!product_id) {
      return res
        .status(400)
        .send({ message: "Request body must include product_id." });
    }
    const newFavorite = await createFavorite(userId, product_id);
    res.status(201).send(newFavorite);
  } catch (err) {
    next(err);
  }
});

app.delete(
  "/api/users/:userId/favorites/:favoriteId",
  async (req, res, next) => {
    try {
      const { userId, favoriteId } = req.params;
      await destroyFavorite(favoriteId, userId);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

const init = async () => {
  try {
    await client.connect();

    await createTables();

    console.log("Creating a test user...");
    const testUser = await createUser("alice", "password123");
    console.log("Created user:", testUser);

    console.log("Creating a test product...");
    const testProduct = await createProduct("Widget");
    console.log("Created product:", testProduct);

    console.log("Creating a test favorite...");
    const testFavorite = await createFavorite(testUser.id, testProduct.id);
    console.log("Created favorite:", testFavorite);

    console.log("Fetching all users...");
    const users = await fetchUsers();
    console.log("All Users:", users);

    console.log("Fetching all products...");
    const products = await fetchProducts();
    console.log("All Products:", products);

    console.log(`Fetching favorites for user ${testUser.id}...`);
    const userFavorites = await fetchFavorites(testUser.id);
    console.log("User Favorites:", userFavorites);

    app.listen(PORT, () => {
      console.log(`\nServer listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting up!", err);
  }
};

init();
