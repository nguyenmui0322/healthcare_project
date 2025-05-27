import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Spin, Alert, Button, Modal, Form, Input, Popconfirm, message } from 'antd';
import api from '../api/api';

const { Title } = Typography;

const DepartmentCRUD = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form] = Form.useForm();

  const fetchDepartments = () => {
    setLoading(true);
    api.get('/api/v1/departments/')
      .then(res => {
        setDepartments(res.data.results || res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải danh sách khoa');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showModal = (department = null) => {
    setEditingDepartment(department);
    if (department) {
      form.setFieldsValue({ ...department });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingDepartment(null);
    form.resetFields();
  };

  const handleFinish = (values) => {
    if (editingDepartment) {
      api.patch(`/api/v1/departments/${editingDepartment.id}/`, values)
        .then(() => {
          message.success('Cập nhật thành công!');
          fetchDepartments();
          handleCancel();
        })
        .catch(() => message.error('Cập nhật thất bại!'));
    } else {
      api.post('/api/v1/departments/', values)
        .then(() => {
          message.success('Thêm thành công!');
          fetchDepartments();
          handleCancel();
        })
        .catch(() => message.error('Thêm thất bại!'));
    }
  };

  const handleDelete = (id) => {
    api.delete(`/api/v1/departments/${id}/`)
      .then(() => {
        message.success('Xóa thành công!');
        fetchDepartments();
      })
      .catch(() => message.error('Xóa thất bại!'));
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Tên khoa', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => showModal(record)}>Sửa</Button>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Card style={{ margin: 24 }}>
      <Title level={2}>Quản lý khoa (CRUD)</Title>
      <Button type="primary" onClick={() => showModal()} style={{ marginBottom: 16 }}>
        Thêm khoa
      </Button>
      {loading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (
        <Table
          dataSource={departments}
          columns={columns}
          rowKey={record => record.id}
          pagination={{ pageSize: 10 }}
        />
      )}
      <Modal
        title={editingDepartment ? 'Sửa khoa' : 'Thêm khoa'}
        open={modalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText={editingDepartment ? 'Cập nhật' : 'Thêm'}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="Tên khoa" rules={[{ required: true, message: 'Nhập tên khoa!' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentCRUD;
