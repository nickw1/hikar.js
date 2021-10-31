import bcrypt from 'bcrypt';

export default class UserModel {
    constructor(db) {
        this.db = db;
    }

    async signup(username, password) {
        const passHash = await bcrypt.hash(password, 10);
        const dbres = await this.db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, passHash]);
        return dbres.rowCount == 1 ? 200: 500;
    }

    async validate (username, password) {
        const dbres = await this.db.query("SELECT * FROM users WHERE username=$1", [username]);
        return dbres.rows.length == 1 ? await bcrypt.compare(password, dbres.rows[0].password) : false;
    }
}
