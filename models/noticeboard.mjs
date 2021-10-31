
export default class NoticeboardModel {
    constructor(db) {
        this.db = db;
    }

    async add({lon, lat, annotationType, text}) {
        const geom = `POINT(${lon} ${lat})`;
        console.log(`INSERT INTO annotations(xy,annotationtype,text) VALUES (${geom},${annotationType},${text})`);
        const dbres = await this.db.query("INSERT INTO annotations(xy,annotationtype,text) VALUES (ST_Transform(ST_GeomFromText($1, 4326),3857),$2,$3)", [geom, annotationType, text]);
        return dbres.rowCount;
    }
}
