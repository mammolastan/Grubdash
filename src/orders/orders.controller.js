const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// middleware

function bodyDataIsValid(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (
      data[propertyName] &&
      data[propertyName] != "" &&
      data[propertyName] != {}
    ) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function dishesIsValid(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  let foundIndex = -1;
  //   if not array
  if (!Array.isArray(dishes)) {
    return next({ status: 400, message: `Must include a dishes array` });
  }
  //   if any dish does not contain a valid quantity
  function checkQuantity(dish, index) {
    foundIndex = index;
    if (
      "quantity" in dish &&
      typeof dish.quantity === "number" &&
      dish.quantity > 0
    ) {
      return false;
    } else return true;
  }
  // if any dish exists without quantity
  const invalidQuantity = dishes.find(checkQuantity);

  if (invalidQuantity != undefined) {
    return next({
      status: 400,
      message: `Dish ${foundIndex} must have a quantity that is an integer greater than 0`,
    });
  } else {
    next();
  }
}

function statusIsValid(req, res, next) {
  const {
    data: { status },
  } = req.body;
  const acceptedValues = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  if (
    status &&
    status.length > 1 &&
    acceptedValues.find((item) => item == status)
  ) {
    if (status == "delivered") {
      return next({
        status: 400,
        message: "A delivered order cannot be changed",
      });
    }
    return next();
  }
  return next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function doValuesMatch(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { orderId } = req.params;
  if (id && id.length > 0) {
    if (id == orderId) {
      return next();
    } else {
      next({
        status: 400,
        message: `order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    }
  } else {
    return next();
  }
}

function orderExists(req, res, next) {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id == orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({
      status: 404,
      message: `order id not found: ${orderId}`,
    });
  }
}

// Use this function to assigh IDs when necessary
const nextId = require("../utils/nextId");

// operations

function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const id = nextId();
  const newOrder = {
    id: id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

  // Update the order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id == orderId);
  if (index > -1 && orders[index].status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}
function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    bodyDataIsValid("deliverTo"),
    bodyDataIsValid("mobileNumber"),
    bodyDataIsValid("dishes"),
    dishesIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataIsValid("deliverTo"),
    bodyDataIsValid("mobileNumber"),
    bodyDataIsValid("dishes"),
    doValuesMatch,
    dishesIsValid,
    statusIsValid,
    update,
  ],
  delete: [orderExists, destroy],
  list,
};
