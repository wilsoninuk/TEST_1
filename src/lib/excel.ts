import ExcelJS from 'exceljs'
import { Product } from '@prisma/client'
import { saveAs } from 'file-saver'

// 定义 Excel 列的映射关系
const EXCEL_HEADERS = {
  itemNo: '商品编号',
  description: '商品描述',
  cost: '成本',
  picture: '商品图片',
  barcode: '条形码',
  color: '颜色/款式',
  material: '材料',
  productSize: '产品尺寸',
  cartonSize: '装箱尺寸',
  cartonWeight: '装箱重量',
  moq: 'MOQ',
  supplier: '供应商',
  link1688: '1688链接',
}

// 导出到 Excel
export async function exportToExcel(products: Product[]) {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('商品列表')

  // 设置列
  worksheet.columns = [
    { header: '商品编号', key: 'itemNo', width: 15 },
    { header: '商品描述', key: 'description', width: 30 },
    { header: '成本', key: 'cost', width: 10 },
    { header: '商品图片', key: 'picture', width: 20 },
    { header: '条形码', key: 'barcode', width: 15 },
    { header: '颜色/款式', key: 'color', width: 15 },
    { header: '材料', key: 'material', width: 15 },
    { header: '产品尺寸', key: 'productSize', width: 15 },
    { header: '装箱尺寸', key: 'cartonSize', width: 15 },
    { header: '装箱重量', key: 'cartonWeight', width: 10 },
    { header: 'MOQ', key: 'moq', width: 10 },
    { header: '供应商', key: 'supplier', width: 20 },
    { header: '1688链接', key: 'link1688', width: 50 },
  ]

  // 设置标题行样式
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // 添加数据和图片
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const rowNumber = i + 2 // 第一行是标题

    // 添加行数据
    const row = worksheet.getRow(rowNumber)
    row.values = {
      itemNo: product.itemNo,
      description: product.description,
      cost: product.cost,
      picture: '', // 图片单元格先置空
      barcode: product.barcode,
      color: product.color,
      material: product.material,
      productSize: product.productSize,
      cartonSize: product.cartonSize,
      cartonWeight: product.cartonWeight,
      moq: product.moq,
      supplier: product.supplier,
      link1688: product.link1688,
    }

    // 设置行高以适应图片
    row.height = 80

    // 如果有图片，添加图片
    if (product.picture) {
      try {
        // 使用代理 API 获取图片
        const imageUrl = product.picture.startsWith('http') 
          ? `/api/image?url=${encodeURIComponent(product.picture)}`
          : product.picture

        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`)
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const imageId = workbook.addImage({
          buffer: Buffer.from(imageArrayBuffer),
          extension: 'jpeg',
        })

        worksheet.addImage(imageId, {
          tl: { col: 3, row: rowNumber - 1 },
          br: { col: 4, row: rowNumber },
          editAs: 'oneCell'
        })
      } catch (error) {
        console.error(`Failed to add image for product ${product.itemNo}:`, error)
        row.getCell('picture').value = '图片加载失败'
      }
    }

    // 设置单元格对齐方式
    row.alignment = { vertical: 'middle', horizontal: 'left' }
  }

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `商品列表_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// 生成模板
export async function generateTemplate() {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('模板')

  // 设置列
  worksheet.columns = [
    { header: '商品编号', key: 'itemNo', width: 15 },
    { header: '商品描述', key: 'description', width: 30 },
    { header: '成本', key: 'cost', width: 10 },
    { header: '商品图片', key: 'picture', width: 50 },
    { header: '条形码', key: 'barcode', width: 15 },
    { header: '颜色/款式', key: 'color', width: 15 },
    { header: '材料', key: 'material', width: 15 },
    { header: '产品尺寸', key: 'productSize', width: 15 },
    { header: '装箱尺寸', key: 'cartonSize', width: 15 },
    { header: '装箱重量', key: 'cartonWeight', width: 10 },
    { header: 'MOQ', key: 'moq', width: 10 },
    { header: '供应商', key: 'supplier', width: 20 },
    { header: '1688链接', key: 'link1688', width: 50 },
  ]

  // 设置标题行样式
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // 添加示例数据
  worksheet.addRow({
    itemNo: 'ABC123',
    description: '示例商品',
    cost: 100,
    picture: 'https://example.com/image.jpg',
    barcode: '123456789',
    color: '红色',
    material: 'PP',
    productSize: '10x10x10cm',
    cartonSize: '50x50x50cm',
    cartonWeight: 5,
    moq: 1000,
    supplier: '示例供应商',
    link1688: 'https://detail.1688.com/xxx'
  })

  // 设置数据行样式
  const dataRow = worksheet.getRow(2)
  dataRow.alignment = { vertical: 'middle', horizontal: 'left' }

  // 添加数据验证和说明
  worksheet.getCell('C2').numFmt = '0.00' // 成本格式
  worksheet.getCell('D2').note = '请填入图片的完整URL地址，例如：https://example.com/image.jpg'
  worksheet.getCell('I2').numFmt = '0.00' // 装箱重量格式
  worksheet.getCell('J2').numFmt = '0' // MOQ格式

  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  saveAs(blob, '商品导入模板.xlsx')
}

// 从 Excel 导入
export async function importFromExcel(file: File) {
  return new Promise<{
    success: Partial<Product>[]
    duplicates: {
      product: Partial<Product>
      existingProduct: Product
      reason: 'itemNo' | 'barcode'
    }[]
    errors: { row: number; error: string }[]
  }>(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)
      
      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        throw new Error('无法读取工作表')
      }

      const result = {
        success: [] as Partial<Product>[],
        duplicates: [] as {
          product: Partial<Product>
          existingProduct: Product
          reason: 'itemNo' | 'barcode'
        }[],
        errors: [] as { row: number; error: string }[]
      }

      // 从第二行开始读取数据（跳过标题行）
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // 跳过标题行

        try {
          // 验证必填字段
          const itemNo = row.getCell('A').value?.toString()
          const description = row.getCell('B').value?.toString()
          const cost = Number(row.getCell('C').value)
          const picture = row.getCell('D').value?.toString()

          if (!itemNo || !description || isNaN(cost)) {
            throw new Error('商品编号、商品描述、成本为必填项')
          }

          // 验证图片URL格式（如果有填写）
          if (picture && !isValidUrl(picture)) {
            throw new Error('图片URL格式不正确')
          }

          // 构建商品数据
          const product: Partial<Product> = {
            itemNo,
            description,
            cost,
            picture: picture || null,
            barcode: row.getCell('E').value?.toString(),
            color: row.getCell('F').value?.toString(),
            material: row.getCell('G').value?.toString(),
            productSize: row.getCell('H').value?.toString(),
            cartonSize: row.getCell('I').value?.toString(),
            cartonWeight: Number(row.getCell('J').value) || null,
            moq: Number(row.getCell('K').value) || null,
            supplier: row.getCell('L').value?.toString(),
            link1688: row.getCell('M').value?.toString(),
          }

          result.success.push(product)
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : '数据格式错误'
          })
        }
      })

      // 检查重复项
      try {
        const response = await fetch('/api/products/check-duplicates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.success)
        })

        if (!response.ok) {
          throw new Error('检查重复失败')
        }

        const duplicates = await response.json()
        
        // 将重复项从 success 移到 duplicates
        result.duplicates = duplicates
        result.success = result.success.filter(product => 
          !duplicates.some(d => d.product.itemNo === product.itemNo)
        )
      } catch (error) {
        console.error('检查重复失败:', error)
      }

      resolve(result)
    } catch (error) {
      reject(new Error('文件解析失败'))
    }
  })
}

// 辅助函数：验证URL格式
function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}