import { environment } from '../../../environments/environment';

export const BASE_URL = environment.apiUrl + '/';

export const API_END_POINTS = {
  REGIONMASTERDD: {
    FIND_ALL: 'RegionMasterDD',
  },
  DISTRIBUTIONDD: {
    FIND_ALL: 'DealerMasterDD',
  },
  OnboardingDD: {
    FIND_ALL: 'DealerMasterDD/Onboarding',
  },
  DISTRIBUTORTYPEDD: {
    FIND_ALL: 'DistributorType',
    FIND_ALLCode: 'DistributorType',

    BY_PARTNER_CHANNEL: 'DistributorType/by-partner-channel',
  },
  DISTRIBUTORGROUPDD: {
    FIND_ALL: 'DistributorGroup',
    DD: 'DistributorGroupDD',
  },
  DESIGNATIONDD: {
    FIND_ALL: 'DesignationDD',
  },
  FUNCTIONALTEAMDD: {
    FIND_ALL: 'FunctionalTeamDD',
  },
  CITYMASTERDD: {
    FIND_ALL: 'CityMasterDD',
    FIND_WITH_TERM: 'CityMasterDD/search',
  },
  GET_BY_STATEID: {
    GET_BY_ID: 'CityMasterDD/Relation',
  },
  GET_BY_REGIONID: {
    GET_BY_ID: 'StateMasterDD/Relation',
  },
  TRANSPORTTYPEDD: {
    FIND_ALL: 'TransportDD',
  },
  EXPENSETYPEDD: {
    FIND_ALL: 'ExpenseTypeDD',
  },
  TOURTYPEDD: {
    FIND_ALL: 'TourTypeDD',
  },
  STATEMASTERDD: {
    FIND_ALL: 'StateMasterDD',
  },
  ROLEDD: {
    FIND_ALL: 'RoleDD',
    FIND_BY_PORTAL: 'RoleDD/GetRoleByPortal',
  },
  DIVISIONDD: {
    FIND_ALL: 'DivisionDD',
  },
  SHIPTODD: {
    FIND_ALL: 'PartnerShipToMaster/GetAll',
  },
  RANGEDD: {
    FIND_ALL: 'RangeMasterDD',
  },
  ItemCategoryDD: {
    FIND_ALL: 'ItemCategoryDD',
  },
  ITEMPRODUCTDD: {
    FIND_ALL: 'ItemProductDD',
  },

  SALESORGDD: {
    FIND_ALL: 'SalesOrgnisationDD',
  },
  PLANTDD: {
    FIND_ALL: 'VipPlantMaster/dropdown',
  },
  PartnerDD: {
    FIND_ALL: 'DealerDDForOrderMob/vip_manager_partners',
  },
  ShipToDD: {
    FIND_ALL: 'PartnerShipToMaster/by-dealer',
  },
  BRANCHDD: {
    FIND_ALL: 'BranchMasterDD',
    FIND_BY_STATE_DISTRICT: 'BranchMasterDD/by-state-district',
    FIND_BY_STATE: 'BranchMasterDD/by-state',
  },

  STOREDD: {
    FIND_ALL: 'StoreMasterDD',
    FIND_BY_WAREHOUSE: 'StoreMasterDD/by-warehouse',
  },

  DISTRIBUTIONCHANNELDD: {
    FIND_ALL: 'DistributionChannelDD',
  },
  COUNTRYDD: {
    FIND_ALL: 'CountryMasterDD',
  },
  ACCTypeDD: {
    FIND_ALL: 'BankAccountType',
  },
  ReasonTypeDD: {
    FIND_ALL: 'ReasonTypeDD',
  },
  MODELDD: {
    FIND_ALL: 'ModelDD',
  },
  SBUDD: {
    FIND_ALL: 'SBUMasterDD',
  },
  SalesCategoryDD: {
    FIND_ALL: 'SalesCategoryMasterDD',
  },

  SalesDivisionDD: {
    FIND_ALL: 'SalesDivisionMasterDD',
  },

  WheelsDD: {
    FIND_ALL: 'WheelsDD',
  },

  ZipDD: {
    FIND_ALL: 'ZipDD',
  },
  LockDD: {
    FIND_ALL: 'LockDD',
  },
  ClassDD: {
    FIND_ALL: 'ClassDD',
  },
  ColorDD: {
    FIND_ALL: 'ColorDD',
  },
  MaterialDD: {
    FIND_ALL: 'MaterialDD',
  },
  SegmentDD: {
    FIND_ALL: 'SegmentDD',
  },

  WarrantyDD: {
    FIND_ALL: 'WarrantyDD',
  },

  CITYDD: {
    FIND_ALL: 'CityMasterDD',
    CityByDistrict: 'CityMasterDD/CityByDistrictDD',
  },
  REGIONDD: {
    FIND_ALL: 'RegionMasterDD',
  },
  STATEDD: {
    FIND_ALL: 'StateMasterDD',
  },

  TASKDD: {
    FIND_ALL: 'TaskDD',
  },
  LOCATIONDD: {
    FIND_ALL: 'DeliveryLocationDD',
  },
  DOCUMENTTYPEMASTERDD: {
    FIND_ALL: 'DocumentTypeMasterDD',
  },
  SHIPPINGDD: {
    FIND_ALL: 'ShippingModeDD',
  },
  PAYMENTTERMSDD: {
    FIND_ALL: 'PaymenntTermsDD',
  },
  CURRENCYDD: {
    FIND_ALL: 'CurrencyDD',
  },
  PRICELISTDD: {
    FIND_ALL: 'PriceListDD',
  },
  CUSTOMERGROUPDD: {
    FIND_ALL: 'CustomerGroupDD',
    CUSTOMER_CODES: 'CustomerGroupDD/CustomerCodes',
  },
  INCOTERMSDD: {
    FIND_ALL: 'IncoTermsDD',
  },
  SESSEDD: {
    FIND_ALL: 'SESSEDD',
  },
  ASMDD: {
    FIND_ALL: 'ASMDD',
  },
  RSMDD: {
    FIND_ALL: 'RSMDD',
  },
  ZSMDD: {
    FIND_ALL: 'ZSMDD',
  },
  MAINAMOUNTMANAGERDD: {
    FIND_ALL: 'MainAmountManagerDD',
  },
  CHEFFDD: {
    FIND_ALL: 'ChefDD',
  },
  CONSIGNEECATEGORYDD: {
    FIND_ALL: 'ConsigneeCategoryDD',
  },
  MRPNONMRPDD: {
    FIND_ALL: 'MrpNonMrpDD',
  },
  MATERIALGROUPDD: {
    FIND_ALL: 'MaterialGroupDD',
  },
  UOMDD: {
    FIND_ALL: 'UomDD',
  },
  SALESUNITDD: {
    FIND_ALL: 'SalesUnitDD',
  },
  SALESUNIT2DD: {
    FIND_ALL: 'SalesUnit2DD',
  },
  WEIGHTUNITDD: {
    FIND_ALL: 'WeightUnitDD',
  },
  MODEOFTRANSPORTDD: {
    FIND_ALL: 'ModeOfTransportDD',
  },
  MODEOFTRANSPORTDDBYID: {
    BY_TRANSPORT_TYPE: 'ModeOfTransportDD/Relation',
  },
  LODGINGTYPEDD: {
    FIND_ALL: 'LodgingTypeDD',
  },
  MONTHLYENTITLEMENTDD: {
    FIND_ALL: 'MonthlyEntitlementDD',
  },
  DISTRICTDD: {
    FIND_ALL: 'DistrictDD',
    RELATION: 'DistrictDD/Relation',
    FIND_ALL_NAMES: 'DistrictDD/AllDistrictNames',
  },
  INDUSTRYDIVISIONDD: {
    FIND_ALL: 'IndustryDivisionDD',
  },
  INDUSTRIALSEGMENTDD: {
    FIND_ALL: 'IndustrialSegmentDD',
  },
  E1CustomerDD: {
    FIND_ALL: 'E1CustomerDD',
  },
  DEALERDD: {
    FIND_ALL: 'DealerMasterDD',
    PRINCIPLE: 'DealerMasterDD/principle',
    NON_PRINCIPLE: 'DealerMasterDD/nonprinciple',
    DEALER: 'DealerMasterDD/dealerdd',
    DEALERBYID: 'DealerMasterDD',
    DEALERBYDD: 'DealerMasterDD/dealercodedd',
    DEALERBYCHANNELDD: 'DealerMasterDD/DealerByChannel',
  },

  LOCATIONTYPEDD: {
    FIND_ALL: 'LocationTypeDD',
  },
  PINCODEDD: {
    FIND_ALL: 'PinCodeDD',
  },

  SUPPLIERDD: {
    FIND_ALL: 'SupplierMasters',
    FIND_WITH_TERM: 'SupplierMastersDD/supplierlist',
    FIND_CODE_NAME: 'SupplierMasters/dropdown',
  },
  SUPPLIERCONTACTMASTER: {
    FIND_ALL: 'SupplierContactMasters',
  },
  CUSTOMERDD: {
    FIND_ALL: 'CustomerDD',
    FIND_BY_DEALER: 'CustomerDD/Relation',
    GET_BY_LEAD_CUSTOMERS: 'CustomerDD/byState',
    GET_BY_LEAD_CUSTOMER: 'CustomerMaster',
    GET_By_PRINCIPLE_CUSTOMER: 'CustomerDD/Relation/PrincipleCustomerDD',
    GET_By_Dealer_CUSTOMER: 'CustomerDD/Relation/DealerCustomerDD',
    GET_By_PRINCIPLES_CUSTOMER: 'CustomerDD/Relation/PrincipleCustomerDD',
  },

  LEADTYPEDD: {
    FIND_ALL: 'LeadTypeDD',
  },

  ACCESSORYDD: {
    FIND_BY_ITEM: 'AccessoryDD/GetAccessoriesByItem', // Usage: `${endpoint}/${itemId}`
    FIND_ALL: 'AccessoryDD/GetAllAccessories',
    FIND_BY_ID: 'AccessoryDD/GetAccessoryById',
    FIND_BY_LEAD_ITEM: 'AccessoryDD/GetAccessoriesByLeadItem', // Usage: `${endpoint}/${id}`
  },

  SALESOFFICEDD: {
    FIND_ALL: 'SalesOfficeDD',
  },
  PRODLINEDD: {
    FIND_ALL: 'ProdLineDD',
  },
  SKUPRODLINEDD: {
    FIND_ALL: 'SKUProductLineDD',
  },
  ITEMCATEGORYDD: {
    FIND_ALL: 'ItemCategoryDD',
  },

  MODELMASTER: {
    FIND_ALL: 'ModelDD',
  },
  CHANNELDD: {
    FIND_ALL: 'ChannelMasterDD',
  },

  LEADCATEGORYDD: {
    FIND_ALL: 'LeadCategoryDD',
  },

  PLAN_TO_PURCHASEDD: {
    FIND_ALL: 'PlanToPurchaseDD',
  },

  LEADSOURCEDD: {
    FIND_ALL: 'LeadSourceDD',
  },
  ACTIVITYCATEGORYDD: {
    FIND_ALL: 'ActivityCategoryDD',
  },
  ACTIVITYLOCATIONDD: {
    FIND_ALL: 'ActivityLocationDD',
  },
  ACTIVITYPURPOSEDD: {
    FIND_ALL: 'ActivityPurposeDD',
  },
  ACTIVITYSTATUSDD: {
    FIND_ALL: 'ActivityStatusDD',
  },
  CUSTOMERPROFILEDD: {
    FIND_ALL: 'CustomerProfileDD',
  },
  ADDITIONALFIELD: {
    FIND_ALL: '',
  },
  SALES_WITHIN: {
    FIND_ALL: 'SalesWithinDD',
  },

  LEADSTATUSDD: {
    FIND_ALL: 'LeadStatusDD',
  },

  LEADDD: {
    FIND_ALL: 'LeadDD',
  },

  LEADSTAGEDD: {
    FIND_ALL: 'LeadStageDD',
  },

  SHIPTOCUSTOMERDD: {
    FIND_ALL: 'ShipToCustomerMaster',
    FIND_BY_DEALER: 'CustomerDD/byDealer',
  },
  PACKGINGDD: {
    FIND_ALL: 'PackagingMaterial',
  },
  INDUSTRYTYPEDD: {
    FIND_ALL: 'IndustryTypeDD',
  },
  OBJECTDD: {
    FIND_ALL: 'ObjectTypeDD',
  },
  CITYTYPEDD: {
    FIND_ALL: 'CityTypeDD',
  },
  LEAVETYPEDD: {
    FIND_ALL: 'LeaveTypeDD',
  },
  YEARDD: {
    FIND_ALL: 'YearDD',
  },
  USERDD: {
    FIND_ALL: 'UserDD', // generic all users
    FIND_BY_DEALER: 'UserDD', // dealer-specific users (will append /{dealerId})
    FIND_BY_PRINCIPLE: 'UserDD/Principal',
  },
  TASKSTATUSDD: {
    FIND_ALL: 'TaskStatusDD',
  },
  CUSTOMERTYPEDD: {
    FIND_ALL: 'CustomerTypeDD',
  },
  CPCDD: {
    FIND_ALL: 'CPCCustomerGroupDD',
  },
  STATUSDD: {
    FIND_ALL: 'StatusDD',
  },
  REGIONRelationDD: {
    FIND_ALL: 'RegionMasterDD/Relation',
  },
  STATERelationDD: {
    FIND_ALL: 'StateMasterDD/Relation',
  },
  CITYRelationDD: {
    FIND_ALL: 'CityMasterDD/Relation',
  },
  CITYDistrictRelationDD: {
    FIND_ALL: 'CityMasterDD/DistrictRelation',
  },
  SALESAREADD: {
    FIND_ALL: 'SalesAreaDD',
  },
  SEGMENT1DD: {
    FIND_ALL: 'Segment1DD',
    FIND_BY_DEALERID: 'Segment1DD/byDealer',
  },
  SEGMENT2DD: {
    FIND_ALL: 'Segment2DD',
    FIND_BY_DEALERID: 'Segment2DD/byDealer',
  },
  ITEMMASTERDD: {
    FIND_ALL: 'ProductMaster',
    FIND_ITEMDD: 'ItemMasterDD',
    FIND_BY_DEALER: 'ProductMaster/dealer',
    FIND_BY_MRP: 'ProductMaster/GetItemDtoWithMrp',
    FIND_ALL_MRP: 'ProductMaster/MRP',
    FIND_PRINCIPLE_DEALER_ITEMS: 'ItemMasterDD/PrincipleDealerItems',
  },
  ITEMMASTERDDNEW: {
    FIND_WITH_TERM: 'ItemMasterDD/ItemList',
    FIND_CODE_DESCRIPTION: 'ItemMasterDD/ItemCodeDescription',
  },
  PACKINGDOCDD: {
    FIND_ALL: 'PackingDocNo',
  },
  PlantLISTDD: {
    FIND_ALL: 'PlantListDD',
  },
  HOLIDAYDD: {
    FIND_ALL: 'Holiday/GetHolidayDD',
  },
  POTypeDD: {
    FIND_ALL: 'POTypeDD',
  },
  CustomerLISTDD: {
    FIND_ALL: 'CustomerDD',
  },
  SOTypeDD: {
    FIND_ALL: 'SalesOrderTypeDD',
  },
  CUSTOMER: {
    FIND_ALL: 'CustomerMaster',
  },
  SHIPTOCUSTOMER: {
    FIND_ALL: 'CustomerShipToMaster',
  },
  SHIPTOCUSTOMERMaster: {
    FIND_ALL: 'ShipToCustomerMaster',
  },
  ASSIGNTO: {
    FIND_ALL: 'AssignToDD',
  },
  DISCOUNTTYPE: {
    FIND_ALL: 'DiscountTypeMasterDD',
  },
  CustomerDD: {
    FIND_ALL: 'CustomerDD/Relation',
  },
  GET_BY_DEALERID: {
    GET_BY_ID: 'CustomerDD/Relation',
  },
  DISCOUNTCATEGORY: {
    FIND_ALL: 'DiscountCategoryMasterDD',
  },
  DISCOUNT_DD: {
    FIND_ALL: 'DiscountDD',
  },

  LODGING_LIMIT_BY_CITY: {
    GET_BY_CITY: 'LodgingLimit/by-city',
  },
  MONTHLY_ENTITILEMENT_LIMITS: {
    GET_BY_ENTITILEMENTID: 'MonthlyEntitlementLimits/by-entitlement',
  },
  TRAVEL_LIMIT: {
    GET_BY_MODEOFTRANPSORTID: 'TourLimits/by-modeofTransport',
  },
  PRICINGCONPARAM: {
    FIND_ALL: 'PricingConditionParameter',
  },
  PRICINGPROCTYPE: {
    FIND_ALL: 'PricingProcedureTypeMasters',
  },
  CUSTOMERMASTER: {
    FIND_ALL: 'CustomerMaster',
  },
  PRICINGCONDITION: {
    FIND_ALL: 'PricingConditionMaster',
  },
  CONDITIONTYPE: {
    FIND_ALL: 'PricingConditionTypeDD',
  },
  CONDITIONSUBTYPE: {
    FIND_ALL: 'PricingConditionSubTypeDD',
  },
  CONDITIONCATEGORY: {
    FIND_ALL: 'PricingConditionCategoryDD',
  },
  PRICINGPROCEDURECONDITIONDD: {
    FIND_ALL: 'PricingProcedureConditionDD',
  },
  GstType: {
    FIND_ALL: 'GetGstTypeDD',
  },
  PACKINGMATERIALDD: {
    FIND_ALL: 'PackingMaterials/PackingMaterialDD',
  },
  BranchDD: {
    FIND_ALL: 'StoreMaster/GetBranchDD',
    FIND_ALL_BY_PINCODE: 'StoreMaster/GetBranchByPinCodeDD',
  },
  SubChannelDD1: {
    FIND_ALL: 'SubChannelDD',
  },
  SubChannelDD: {
    FIND_ALL: 'StoreMaster/GetSubChannelDD',
  },
  ChainDD: {
    FIND_ALL: 'StoreMaster/GetChainDD',
  },
  ZoneDD: {
    FIND_ALL: 'StoreMaster/GetZoneDD',
  },
  GetStoreMasterDD: {
    FIND_ALL: 'StoreMaster/GetStoreMasterDD',
  },
  GetPartnerChannelDD: {
    FIND_ALL: 'StoreMaster/GetPartnerChannelDD',
  },
  GetPartnerGroupDD: {
    FIND_ALL: 'PartnerGroup',
  },
  RegionalDepotDD: {
    FIND_ALL: 'StoreMaster/GetRegionalDepotDD',
  },
  StoreTypeDD: {
    FIND_ALL: 'StoreMaster/GetStoreTypeDD',
  },
  PinCodeDD: {
    FIND_ALL: 'PinCodeMaster/GetPinCodeMasterDD',
    FIND_BY_CITY: 'PinCodeMaster/Relation',
    FIND_WITH_TERM: 'PinCodeMaster/search',
  },
};
