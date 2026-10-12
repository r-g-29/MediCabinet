// Zod validation middleware factory – validates req.body against a zod schema
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ success: false, message });
  }
  req.body = result.data; // use the parsed (coerced) data
  next();
};

module.exports = validate;
