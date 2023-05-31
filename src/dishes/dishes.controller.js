const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// middleware

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function dishExists(req, res, next) {
  const { dishId } = req.params;

  //   const foundDish = dishes.find((dish) => dish.id === Number(dishId));
  const foundDish = dishes.find((dish) => dish.id == dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({
      status: 404,
      message: `dish id not found: ${dishId}`,
    });
  }
}

function isPriceValid(req, res, next) {
  const {
    data: { price },
  } = req.body;

  if (typeof price == "number" && Number(price) > 0) {
    return next();
  } else {
    next({
      status: 400,
      message: `price must be valid`,
    });
  }
}

function doValuesMatch(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { dishId } = req.params;
  if (id) {
    if (id == dishId) {
      return next();
    } else {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
  } else {
    return next();
  }
}

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// operations
function create(req, res) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const id = nextId();
  const newDish = {
    id: id,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  const { dishId } = req.params;
  //   const foundDish = dishes.find((dish) => dish.id == dishId);
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  // Update the dish
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    isPriceValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    isPriceValid,
    doValuesMatch,
    update,
  ],
  list: list,
};
