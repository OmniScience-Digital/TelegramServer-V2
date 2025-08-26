const reportRepository = require('../repositories/postgress_repository');

const auditorService = async (scales, postgressStarttime, postgressEndtime) => {
  try {
    const auditService = await reportRepository.getBatchFlowValues(scales, postgressStarttime, postgressEndtime);
    return auditService;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  auditorService,
};
