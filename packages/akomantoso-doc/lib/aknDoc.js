const { create, convert } = require('xmlbuilder2');
const utils = require('./templates');

/**
 * @description Wraps an Akoma Ntoso (AKN) document into a class. Allows to export an
 * AKN document to a string and to import a new one from a string,
 */
class AKNDoc {
  /**
   * @description Creates an instance of AKNDoc.
   */
  constructor() {
    this.metaAndMain = {};
    this.conclusions = {};
    this.signaturesNum = 0;

    this.create = create;
  }

  /**
   * @description Creates a new ANK document and stores it in this.metaAndMain
   * @param {Object} docElements An object used to create the document.
   */
  newAKNDocument(docElements) {
    const xml = JSON.parse(JSON.stringify(utils.templates.metaAndMainTemplate));
    //meta
    ////Identification
    //////FRBRWork
    Object.keys(docElements.identification.FRBRWork).forEach((e) => {
      if (e in xml.akomaNtoso.doc.meta.identification.FRBRWork) {
        xml.akomaNtoso.doc.meta.identification.FRBRWork[e] = {
          ...xml.akomaNtoso.doc.meta.identification.FRBRWork[e],
          ...docElements.identification.FRBRWork[e],
        };
      } else {
        xml.akomaNtoso.doc.meta.identification.FRBRWork[e] = {
          ...docElements.identification.FRBRWork[e],
        };
      }
    });
    //////
    //////FRBRExpression
    Object.keys(docElements.identification.FRBRExpression).forEach((e) => {
      if (e in xml.akomaNtoso.doc.meta.identification.FRBRExpression) {
        xml.akomaNtoso.doc.meta.identification.FRBRExpression[e] = {
          ...xml.akomaNtoso.doc.meta.identification.FRBRExpression[e],
          ...docElements.identification.FRBRExpression[e],
        };
      } else {
        xml.akomaNtoso.doc.meta.identification.FRBRExpression[e] = {
          ...docElements.identification.FRBRExpression[e],
        };
      }
    });
    //////
    //////FRBRManifestation
    Object.keys(docElements.identification.FRBRManifestation).forEach((e) => {
      if (e in xml.akomaNtoso.doc.meta.identification.FRBRManifestation) {
        xml.akomaNtoso.doc.meta.identification.FRBRManifestation[e] = {
          ...xml.akomaNtoso.doc.meta.identification.FRBRManifestation[e],
          ...docElements.identification.FRBRManifestation[e],
        };
      } else {
        xml.akomaNtoso.doc.meta.identification.FRBRManifestation[e] = {
          ...docElements.identification.FRBRManifestation[e],
        };
      }
    });
    //////
    ////
    ////Reference
    Object.keys(docElements.references).forEach((r) => {
      if (
        xml.akomaNtoso.doc.meta.references[docElements.references[r].type] ===
        undefined
      )
        xml.akomaNtoso.doc.meta.references[docElements.references[r].type] = [];
      xml.akomaNtoso.doc.meta.references[docElements.references[r].type].push({
        '@eId': docElements.references[r]['@eId'],
        '@href': docElements.references[r]['@href'],
        '@showAs': docElements.references[r]['@showAs'],
      });
    });
    ////
    //
    //preface
    xml.akomaNtoso.doc.preface.longTitle.p = docElements.prefaceTitle;
    //
    //mainBody
    xml.akomaNtoso.doc.mainBody['tblock'] = [];
    let iBlock = 1;
    Object.keys(docElements.mainBody).forEach((b) => {
      xml.akomaNtoso.doc.mainBody['tblock'].push({
        '@eId': `tblock_${iBlock}`,
        heading: {
          '@eId': `tblock_${iBlock}__heading`,
          '#': docElements.mainBody[b].blockTitle,
        },
        p: {
          '@eId': `tblock_${iBlock}__p_${iBlock++}`,
          ...docElements.mainBody[b].p,
        },
      });
    });
    //

    this.metaAndMain = xml;
  }

  /**
   * @description Creates an instance of AKNDoc from a string.
   * @static
   * @param {string} string The string representing a valid AKN document.
   * @return {string}
   */
  static fromString(string) {
    const xml = convert(string, { format: 'object' });
    if (!('akomaNtoso' in xml)) return;
    const temp = new AKNDoc();

    temp.metaAndMain = xml;
    if (xml.akomaNtoso.doc.conclusions !== 'undefined') {
      temp.conclusions = xml.akomaNtoso.doc.conclusions;
      delete temp.metaAndMain.akomaNtoso.doc.conclusions;
    }

    return temp;
  }

  /**
   * @description Adds a signature to the AKN document.
   * @param {string} eId The eId of the signatory
   * @param {string} name The name of the signatory
   * @param {string} signature The signature to add
   */
  addSignature(
    eId,
    name,
    roleEId,
    roleName,
    publicKeyHref,
    publicKey,
    timestamp,
    signature
  ) {
    if (Object.keys(this.conclusions).length == 0)
      this.conclusions = { ...utils.templates.conclTemplate.conclusions };

    this.conclusions.signature.push({
      person: {
        '@eId': `conclusion_signature_${++this.signaturesNum}_pers`,
        '@refersTo': eId,
        '#': name,
      },
      role: {
        '@eId': `conclusion_signature_${this.signaturesNum}_pers_role`,
        '@refersTo': roleEId,
        '#': roleName,
      },
      publicKey: {
        '@eId': `conclusion_signature_${this.signaturesNum}_pk`,
        ref: {
          '@eId': `conclusion_signature_${this.signaturesNum}_pk_ref`,
          '@href': publicKeyHref,
          '#': publicKey,
        },
      },
      timestamp: {
        '@eId': `conclusion_signature_${this.signaturesNum}_timestamp`,
        '@date': timestamp,
        '#': timestamp,
      },
      digitalSignature: signature,
    });
  }

  /**
   * @description Adds a software signature to the AKN document.
   * @param {string} eId The eId of the software
   * @param {string} name The name of the software
   * @param {string} signature The signature to add
   */
  addSwSignature(eId, name, signature) {
    if (Object.keys(this.conclusions).length == 0)
      this.conclusions = { ...utils.templates.conclTemplate.conclusions };

    this.conclusions.signature.push({
      object: {
        '@eId': `conclusion_signature_${++this.signaturesNum}_sw`,
        '@refersTo': eId,
        '#': name,
      },
      digitalSignature: signature,
    });
  }

  /**
   * @description Finalizes the AKN document by returning the string that
   * represents the XML document, omitting the conclusions part.
   * (Usually used for the signature payload).
   * @return {string} The XML document string representation
   */
  finalizeNoConclusions() {
    if (Object.keys(this.metaAndMain).length === 0) return;
    const xml = JSON.parse(JSON.stringify(this.metaAndMain));

    const final = this.create(xml);
    return final.end({ prettyPrint: true });
  }

  /**
   * @description Finalizes the AKN document by returning the string that
   * represents the XML document
   * @return {string} The XML document string representation
   */
  finalize() {
    if (Object.keys(this.metaAndMain).length === 0) return;
    const xml = { ...this.metaAndMain };
    if (Object.keys(this.conclusions).length !== 0)
      xml.akomaNtoso.doc.conclusions = { ...this.conclusions };

    const final = this.create(xml);
    return final.end({ prettyPrint: true });
  }
}

module.exports = { AKNDoc };
