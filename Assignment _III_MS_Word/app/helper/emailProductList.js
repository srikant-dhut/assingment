const transporter = require("../config/emailConfig");
const Product = require("../moduals/ProductModel");
const Category = require("../moduals/CategoriesModel");

const sendProductListEmail = async (userEmail, userName) => {
  try {
    // Get all products with category information using aggregation
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          stock: 1,
          categoryName: '$categoryInfo.name'
        }
      },
      {
        $sort: { categoryName: 1, name: 1 }
      }
    ]);

    // Create HTML table
    let tableRows = '';
    products.forEach(product => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${product.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">$${product.price}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.stock}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${product.categoryName || 'N/A'}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Product Catalog</h2>
        <p>Dear ${userName},</p>
        <p>Here is the complete list of our products:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Price</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Stock</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Total Products: ${products.length}
        </p>
        
        <p style="margin-top: 20px;">
          Thank you for your interest in our products!
        </p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "Complete Product Catalog",
      html: htmlContent,
    });

    return { success: true, message: "Product list sent successfully" };
  } catch (error) {
    console.error("Error sending product list email:", error);
    throw new Error("Failed to send product list email");
  }
};

module.exports = sendProductListEmail;
