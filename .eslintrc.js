module.exports = {
    "env": {
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "recommended/node"
    ],
    "rules": {
        "no-console": "off",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "globals": {
        "require": true,
        "module": true
    }
};