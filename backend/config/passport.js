const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User } = require('../src/models');

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findByPk(jwt_payload.id, {
          attributes: { exclude: ['password'] },
        });

        if (user && user.is_active) {
          return done(null, user);
        }

        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
