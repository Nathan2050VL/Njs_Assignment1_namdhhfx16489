const path = require("path");
const fs = require("fs");

const Staff = require("../models/staff");
const Covid = require("../models/covid");
const fileHelper = require("../util/file");
const PDFDocument = require("pdfkit");

const ITEM_PER_PAGE = 5;
let manager;
let staffs;
Staff.findOne({ isManager: true }).then((staff) => {
    manager = staff;
});
Staff.findOne({ isManager: false }).then((staff) => {
    staffs = staff;
});

exports.getStaff = (req, res, next) => {
    res.render("viewStaff/staff-info", {
        pageTitle: "Thông Tin Nhân Viên",
        path: "/staff",
        staff: req.staff,
        doB: `${req.staff.doB.getDate()}/${req.staff.doB.getMonth() + 1
            }/${req.staff.doB.getFullYear()}`,
        startDate: `${req.staff.startDate.getDate()}/${req.staff.startDate.getMonth() + 1
            }/${req.staff.startDate.getFullYear()}`,
        errMessage: null,
    });
};

exports.getIndex = (req, res, next) => {
    res.render("viewStaff/index", {
        pageTitle: "Điểm Danh",
        path: "/",
        staff: req.staff,
        isWork: req.staff.isWork,
        totalHours: req.staff.totalHours,
        messageErr: null,
    });
};

exports.postImage = (req, res, next) => {
    const image = req.file;
    if (!image) {
        return res.status(422).render("viewStaff/staff-info", {
            pageTitle: "Thông Tin Nhân Viên",
            path: "/staff",
            staff: req.staff,
            doB: `${req.staff.doB.getDate()}/${req.staff.doB.getMonth() + 1
                }/${req.staff.doB.getFullYear()}`,
            startDate: `${req.staff.startDate.getDate()}/${req.staff.startDate.getMonth() + 1
                }/${req.staff.startDate.getFullYear()}`,
            errMessage: "Chỉ có thể lưu file ảnh",
        });
    }

    Staff.findById(req.staff._id)
        .then((staff) => {
            //Check path da ton tai hay chua neu co thi xoa path cu
            if (fs.existsSync(staff.imageUrl)) {
                fileHelper.deleteFile(staff.imageUrl);
            }
            //Cap nhat url anh
            staff.imageUrl = image.path;
            return staff.save();
        })
        .then((result) => {
            return res.redirect("/staff");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    // .catch(err => console.log(err))
};

exports.getWork = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    let dataSession = [];
    let dataResult = [];
    Staff.findById(req.staff._id)
        .then((staff) => {
            totalItems = staff.sessionWork.reduce((acc, item) => {
                return acc + item.length;
            }, 0);
            //Chuyen tat ca object vao mang moi
            staff.sessionWork.forEach((item) => {
                item.forEach((i) => {
                    return dataSession.push(i);
                });
            });
            for (let i = (page - 1) * ITEM_PER_PAGE; i < page * ITEM_PER_PAGE; i++) {
                if (dataSession[i] != undefined)
                    dataResult.push(dataSession[i]);
            }
                return dataResult;
        })
        .then((dataResult) => {
            return res.render("viewStaff/woking-hours-info", {
                pageTitle: "Thông tin giờ làm",
                path: "/work",
                staff: req.staff,
                dataInPage: dataResult,
                salary: 0,
                errMessage: null,
                monthSalary: null,
                totalOTInMonth: 0,
                missingHours: 0,
                manager: manager,
                currentPage: page,
                hasNextPage: ITEM_PER_PAGE * page < totalItems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postWork = (req, res, next) => {
    const item = req.staff.sessionWork.length - 1;
    const itemIndex = req.staff.sessionWork[item].length - 1;
    const monthSalary = req.body.monthSalary;
    const monthSalarySelected =
        req.staff.sessionWork[item][itemIndex].timeStart.getMonth() + 1;
    const page = +req.query.page || 1;
    let dataSession = [];
    let dataResult = [];
    let totalItems;
    let salary = 0;
    let errMessage;
    // Tinh tong so gio OT
    let totalOTInMonth = req.staff.sessionWork.reduce((acc, cur) => {
        return acc + cur[cur.length - 1].overTime;
    }, 0);
    //Tinh tong so gio lam thieu
    let missingHours = req.staff.sessionWork.reduce((acc, cur) => {
        let missHour =
            cur[cur.length - 1].totalHourWork <= 8 ?
                8 - cur[cur.length - 1].totalHourWork :
                0;
        return acc + missHour;
    }, 0);
    //Kiem tra thang chon xem da co thong tin chua
    if (monthSalary == monthSalarySelected) {
        salary =
            req.staff.salaryScale * 3000000 +
            (totalOTInMonth - missingHours) * 200000;
    } else {
        errMessage = "Chưa có thông tin lương của tháng này.";
    }

    Staff.findById(req.staff._id)
        .then((staff) => {
            totalItems = staff.sessionWork.reduce((acc, item) => {
                return acc + item.length;
            }, 0);
            staff.sessionWork.forEach((item) => {
                item.forEach((i) => {
                    return dataSession.push(i);
                });
            });
            for (let i = (page - 1) * ITEM_PER_PAGE; i < page * ITEM_PER_PAGE; i++) {
                dataResult.push(dataSession[i]);
            }
            return dataResult;
        })
        .then((dataResult) => {
            return res.render("viewStaff/woking-hours-info", {
                pageTitle: "Thông tin giờ làm",
                path: "/work",
                staff: req.staff,
                dataInPage: dataResult,
                salary: salary,
                errMessage: errMessage,
                monthSalary: monthSalary,
                totalOTInMonth: totalOTInMonth,
                missingHours: missingHours,
                manager: manager,
                currentPage: page,
                hasNextPage: ITEM_PER_PAGE * page < totalItems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCovid = (req, res, next) => {
    console.log(req.staff);
    Covid.find({ "staff.staffId": req.staff._id })
        .then((covidData) => {
            if (covidData.length == 0) {
                return res.render("viewStaff/covid-info", {
                    pageTitle: "Thông tin covid",
                    path: "/covid",
                    staff: req.staff,
                    covid: "",
                    staffs: staffs,
                });
            }
            const covid = covidData[0];
            let dateInfection = "";
            if (covid.dateInfection == undefined) {
                dateInfection = "Chưa cập nhật";
            } else {
                dateInfection = `${covid.dateInfection.getDate()}/${covid.dateInfection.getMonth() + 1
                    }/${covid.dateInfection.getFullYear()}`;
            }
            return res.render("viewStaff/covid-info", {
                pageTitle: "Thông tin covid",
                path: "/covid",
                staff: req.staff,
                covid: covid,
                staffs: staffs,
                dateVaccine1: `${covid.dateVaccine1.getDate()}/${covid.dateVaccine1.getMonth() + 1
                    }/${covid.dateVaccine1.getFullYear()}`,
                dateVaccine2: `${covid.dateVaccine2.getDate()}/${covid.dateVaccine2.getMonth() + 1
                    }/${covid.dateVaccine2.getFullYear()}`,
                dateTemp: `${covid.dateTemp.getHours()}h${covid.dateTemp.getMinutes()} - ${covid.dateTemp.getDate()}/${covid.dateTemp.getMonth() + 1
                    }/${covid.dateVaccine2.getFullYear()}`,
                dateInfection: dateInfection,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCovid = (req, res, next) => {
    const temp = req.body.temp;
    const dateTemp = new Date().toISOString();
    const dateVaccine1 = req.body.dateVaccine1;
    const typeVaccine1 = req.body.typeVaccine1;
    const dateVaccine2 = req.body.dateVaccine2;
    const typeVaccine2 = req.body.typeVaccine2;
    const dateInfection = req.body.dateInfection;
    const place = req.body.place;
    Covid.find({ "staff.staffId": req.staff._id })
        .then((covidData) => {
            //kiem tra da co du lieu covid hay chua
            if (covidData.length === 0) {
                const covid = new Covid({
                    temp: temp,
                    dateTemp: new Date(dateTemp),
                    dateVaccine1: dateVaccine1,
                    typeVaccine1: typeVaccine1,
                    dateVaccine2: dateVaccine2,
                    typeVaccine2: typeVaccine2,
                    dateInfection: dateInfection,
                    place: place,
                    staff: {
                        name: req.staff.name,
                        staffId: req.staff,
                    },
                });
                return covid.save();
            } else {
                const covid = covidData[0];
                covid.temp = temp;
                covid.dateTemp = new Date(dateTemp);
                covid.dateVaccine1 = dateVaccine1;
                covid.typeVaccine1 = typeVaccine1;
                covid.dateVaccine2 = dateVaccine2;
                covid.typeVaccine2 = typeVaccine2;
                covid.dateInfection = dateInfection;
                covid.place = place;
                covid.staff.name = req.staff.name;
                covid.staff.staffId = req.staff;
                return covid.save();
            }
        })
        .then(() => {
            return res.redirect("/covid");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postWorking = (req, res, next) => {
    const timeStart = new Date().toISOString();
    const name = req.staff.name;
    const placeWork = req.body.placeWork;
    Staff.findById(req.staff._id)
        .then((staff) => {
            staff.isWork = true;
            const item = [];
            const itemSection = {
                timeStart: new Date(timeStart),
                name: name,
                placeWork: placeWork,
            };
            item.push(itemSection);
            //Neu chua co ngay lam nao thi push vao phan tu dau tien
            if (staff.sessionWork[staff.sessionWork.length - 1][0] === undefined) {
                staff.sessionWork[staff.sessionWork.length - 1].push(itemSection);
                return staff.save();
            }
            if (
                itemSection.timeStart.getMonth() !=
                staff.sessionWork[staff.sessionWork.length - 1][0].timeStart.getMonth()
            ) {
                staff.confirm = false;
            }
            //Neu ngay thay doi thi push mang moi vao sessionWork
            if (
                itemSection.timeStart.getDate() !=
                staff.sessionWork[staff.sessionWork.length - 1][0].timeStart.getDate()
            ) {
                //Reset tong gio lam va lich off khi chuyen sang ngay moi
                staff.onLeave = {};
                staff.totalHours = 0;
                staff.sessionWork.push(item);
                return staff.save();
            }
            //Neu ngay khong thay doi thi push object moi vao mang cua ngay lam do
            staff.sessionWork[staff.sessionWork.length - 1].push(itemSection);
            return staff.save();
        })
        .then((result) => {
            return res.redirect("/");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEndWorking = (req, res, next) => {
    const timeEnd = new Date();
    Staff.findById(req.staff._id)
        .then((staff) => {
            // Lay ra object cuoi cung cua sessionWork[item[]]
            const item = staff.sessionWork.length - 1;
            const itemIndex = staff.sessionWork[item].length - 1;
            let totalTimeWork = new Date(
                new Date(timeEnd).getTime() -
                staff.sessionWork[item][itemIndex].timeStart.getTime()
            );
            //Chuyen doi tu miliseconds sang hours
            totalTimeWork = totalTimeWork / 1000 / 3600;

            staff.isWork = false;
            staff.totalHours += +totalTimeWork.toFixed(1);
            staff.sessionWork[item][itemIndex].totalHour = totalTimeWork.toFixed(1);
            staff.sessionWork[item][itemIndex].timeEnd = new Date(timeEnd);
            // staff.sessionWork = [
            //     []
            // ]
            return staff.save();
        })
        .then((result) => {
            return res.redirect("/");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEndDayWork = (req, res, next) => {
    Staff.findById(req.staff._id)
        .then((staff) => {
            const item = staff.sessionWork.length - 1;
            const itemIndex = staff.sessionWork[item].length - 1;
            staff.sessionWork[item][itemIndex].totalHourWork = staff.totalHours;
            staff.sessionWork[item][itemIndex].hourAnnualLeave =
                staff.onLeave.hourAnnualLeave;
            staff.sessionWork[item][itemIndex].dateStart = staff.onLeave.dateStart;
            staff.sessionWork[item][itemIndex].dateEnd = staff.onLeave.dateEnd;
            staff.sessionWork[item][itemIndex].reason = staff.onLeave.reason;
            //Check neu tong gio lam cua ngay lon hon 8 thi tinh vao gio OT
            if (staff.totalHours > 8) {
                staff.sessionWork[item][itemIndex].overTime = staff.totalHours - 8;
            } else {
                staff.sessionWork[item][itemIndex].overTime = 0;
            }
            staff.totalHours = 0;
            return staff.save();
        })
        .then(() => {
            res.redirect("/");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postOffWork = (req, res, next) => {
    const dateStart = new Date(req.body.dateStart);
    const dateEnd = new Date(req.body.dateEnd);
    const reason = req.body.reason;
    const hourAnnualLeave = req.body.hourAnnualLeave;
    Staff.findById(req.staff._id)
        .then((staff) => {
            let messageErr;
            //Check truong hop so ngay dang ky lon hon so ngay nghi con lai
            if (dateEnd.getDate() - dateStart.getDate() > staff.annualLeave) {
                messageErr = "Số ngày đăng ký vượt quá ngày nghỉ cho phép.";
                return res.status(422).render("viewStaff/index", {
                    pageTitle: "Điểm Danh",
                    path: "/",
                    staff: req.staff,
                    isWork: req.staff.isWork,
                    totalHours: req.staff.totalHours,
                    messageErr: messageErr,
                });
            }
            //Check ngay da duoc dang ky truoc do
            staff.sessionWork.forEach((item) => {
                item.forEach((i) => {
                    if (i.dateStart) {
                        if (
                            (i.dateStart.getDate() == dateStart.getDate() &&
                                i.dateStart.getMonth() == dateStart.getMonth()) ||
                            (i.dateEnd.getDate() == dateEnd.getDate() &&
                                i.dateEnd.getMonth() == dateEnd.getMonth())
                        ) {
                            messageErr =
                                "Ngày chọn đã được đăng ký trước đó, vui lòng chọn ngày khác..";
                            return res.status(422).render("viewStaff/index", {
                                pageTitle: "Điểm Danh",
                                path: "/",
                                staff: req.staff,
                                isWork: req.staff.isWork,
                                totalHours: req.staff.totalHours,
                                messageErr: messageErr,
                            });
                        }
                    }
                });
            });

            // Check truong hop nghi 1 ngay
            if (dateEnd.getDate() == dateStart.getDate()) {
                staff.annualLeave =
                    hourAnnualLeave <= 4 ?
                        staff.annualLeave - 0.5 :
                        staff.annualLeave - 1;
            }
            //Check truong hop nghi nhieu ngay
            if (dateEnd.getDate() > dateStart.getDate()) {
                const hourNum = hourAnnualLeave <= 4 ? 0.5 : 1;
                staff.annualLeave =
                    staff.annualLeave -
                    (dateEnd.getDate() - dateStart.getDate() + hourNum);
            }
            if (!messageErr) {
                const leaveInfo = {
                    dateStart: dateStart,
                    dateEnd: dateEnd,
                    reason: reason,
                    hourAnnualLeave: hourAnnualLeave,
                };
                staff.onLeave = leaveInfo;
                return staff.save().then(() => {
                    res.redirect("/");
                });
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCovidPdf = (req, res, next) => {
    const covidId = req.params.covidId;
    Covid.findById(covidId)
        .then((covid) => {
            if (!covid) return next(new Error("Không tìm thấy thông tin Covid"));
            // if (covid.staff.staffId.toString() !== req.staff._id.toString()) {
            //     return next(new Error('Không hợp lệ'))
            // }
            //Dat ten file
            const covidFileName = "covidInfo_" + covidId + ".pdf";
            //Dat duong dan
            const covidFilePath = path.join("data", "covidData", covidFileName);
            const pdfDoc = new PDFDocument();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'inline; filename="' + covidFileName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(covidFilePath));
            pdfDoc.pipe(res);
            pdfDoc.font("Times-Roman").fontSize(26).text("Covid Infomation", {
                align: "center",
            });
            pdfDoc.text("-----------------------", {
                align: "center",
            });
            pdfDoc
                .font("Times-Roman")
                .fontSize(16)
                .text(
                    `- Temperature: ${covid.temp
                    }, time: ${covid.dateTemp.getHours()}h${covid.dateTemp.getMinutes()} - ${covid.dateTemp.getDate()}/${covid.dateTemp.getMonth() + 1
                    }/${covid.dateVaccine2.getFullYear()}`
                );
            pdfDoc
                .font("Times-Roman")
                .fontSize(16)
                .text(
                    `- 1st day of injection: ${covid.dateVaccine1.getDate()}/${covid.dateVaccine1.getMonth() + 1
                    }/${covid.dateVaccine1.getFullYear()}`
                );
            pdfDoc
                .font("Times-Roman")
                .fontSize(16)
                .text(`- Type: ${covid.typeVaccine1}`);
            pdfDoc
                .font("Times-Roman")
                .fontSize(16)
                .text(
                    `- 2nd day of injection: ${covid.dateVaccine2.getDate()}/${covid.dateVaccine2.getMonth() + 1
                    }/${covid.dateVaccine2.getFullYear()}`
                );
            pdfDoc
                .font("Times-Roman")
                .fontSize(16)
                .text(`- Type: ${covid.typeVaccine2}`);
            if (!covid.dateInfection) {
                pdfDoc.font("Times-Roman").fontSize(16).text("- Infected: No");
            } else {
                pdfDoc.font("Times-Roman").fontSize(16).text("- Infected: Yes");
                pdfDoc
                    .font("Times-Roman")
                    .fontSize(16)
                    .text(
                        `- Infected day: ${covid.dateInfection.getDate()}/${covid.dateInfection.getMonth() + 1
                        }/${covid.dateInfection.getFullYear()}`
                    );
                pdfDoc
                    .font("Times-Roman")
                    .fontSize(16)
                    .text(`- Places went to: ${covid.place}`);
            }

            pdfDoc.end();
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getManager = (req, res, next) => {
    Staff.findOne({ isManager: false })
        .then((staff) => {
            res.render("viewStaff/manager", {
                pageTitle: "Quản Lý Giờ Làm Nhân Viên",
                path: "/manager",
                staff: staff,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getStaffManager = (req, res, next) => {
    const staffId = req.params.staffId;
    Staff.findById(staffId)
        .then((staff) => {
            res.render("viewStaff/staffManager", {
                pageTitle: `Thông tin giờ làm ${staff.name}`,
                path: `/manager/${staffId}`,
                staff: staff,
                dataResult: null,
                errMessage: null,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDelete = (req, res, next) => {
    const sessionWorkId = req.body.sessionWorkId;
    Staff.findOne({ isManager: false })
        .then((staff) => {
            staff.sessionWork.forEach((items, index) => {
                //Lay ra array moi co id khac voi id muon xoa
                const newItem = items.filter(
                    (i) => i._id.toString() !== sessionWorkId.toString()
                );
                staff.sessionWork[index] = newItem;
            });
            return staff.save();
        })
        .then((staff) => {
            console.log("Xoa thanh cong");
            res.redirect(`/manager/${staff._id}`);
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postConfirm = (req, res, next) => {
    const staffId = req.body.staffId;
    Staff.findById(staffId)
        .then((staff) => {
            //Chuyen trang thai xac nhan gio lam
            staff.confirm = true;
            staff.save();
        })
        .then(() => {
            res.redirect(`/manager/${staffId}`);
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postSelectMonth = (req, res, next) => {
    const selectMonth = +req.body.selectMonth;
    const staffId = req.body.staffId;
    let data = [];
    Staff.findById(staffId)
        .then((staff) => {
            //Chuyen tat ca object vao mang moi
            staff.sessionWork.forEach((item) => {
                item.forEach((i) => {
                    return data.push(i);
                });
            });
            //Loc ra object co thang bang thang da chon
            const dataResult = data.filter((i) => {
                return i.timeStart.getMonth() + 1 == selectMonth;
            });
            if (dataResult.length > 0) {
                return res.render("viewStaff/staffManager", {
                    pageTitle: `Thông tin giờ làm ${staff.name}`,
                    path: `/manager/${staffId}`,
                    staff: staff,
                    dataResult: dataResult,
                    errMessage: null,
                });
            } else {
                return res.render("viewStaff/staffManager", {
                    pageTitle: `Thông tin giờ làm ${staff.name}`,
                    path: `/manager/${staffId}`,
                    staff: staff,
                    dataResult: null,
                    errMessage: "Chưa có dữ liệu của tháng này",
                });
            }
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCovidManager = (req, res, next) => {
    const staffId = req.params.staffId;
    console.log(staffId);
    Covid.find({ "staff.staffId": staffId }).then((covidData) => {
        if (covidData.length == 0) {
            return res.render("viewStaff/covidManager", {
                pageTitle: "Thông tin covid",
                path: "/covid",
                staff: req.staff,
                covid: "",
                staffs: staffs,
            });
        }
        const covid = covidData[0];
        let dateInfection = "";
        if (covid.dateInfection == undefined) {
            dateInfection = "Chưa cập nhật";
        } else {
            dateInfection = `${covid.dateInfection.getDate()}/${covid.dateInfection.getMonth() + 1
                }/${covid.dateInfection.getFullYear()}`;
        }
        return res.render("viewStaff/covidManager", {
            pageTitle: "Thông tin covid",
            path: "/covid",
            staff: req.staff,
            covid: covid,
            staffs: staffs,
            dateVaccine1: `${covid.dateVaccine1.getDate()}/${covid.dateVaccine1.getMonth() + 1
                }/${covid.dateVaccine1.getFullYear()}`,
            dateVaccine2: `${covid.dateVaccine2.getDate()}/${covid.dateVaccine2.getMonth() + 1
                }/${covid.dateVaccine2.getFullYear()}`,
            dateTemp: `${covid.dateTemp.getHours()}h${covid.dateTemp.getMinutes()} - ${covid.dateTemp.getDate()}/${covid.dateTemp.getMonth() + 1
                }/${covid.dateVaccine2.getFullYear()}`,
            dateInfection: dateInfection,
        });
    });
};